import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, serverTimestamp, updateDoc } from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
  uploadBytesResumable,
} from 'firebase/storage';
import { db, firebaseStorage } from '../firebase/config';

const withTimeout = async <T>(label: string, promise: Promise<T>, ms: number): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} excedeu o tempo limite (${Math.round(ms / 1000)}s).`));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

const uploadResumableWithTimeout = async (
  label: string,
  ref: ReturnType<typeof storageRef>,
  file: Blob,
  metadata: { contentType?: string },
  ms: number
): Promise<void> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return await new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(ref, file, metadata);

    timeoutId = setTimeout(() => {
      try {
        task.cancel();
      } catch {
        // ignore
      }
      reject(new Error(`${label} excedeu o tempo limite (${Math.round(ms / 1000)}s).`));
    }, ms);

    task.on(
      'state_changed',
      () => {
        // progresso opcional (mantemos silencioso)
      },
      (err) => {
        if (timeoutId) clearTimeout(timeoutId);
        reject(err);
      },
      () => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve();
      }
    );
  });
};

export interface Livro {
  id: string;
  titulo: string;
  autor: string;
  descricao: string;
  categoria: string;
  capa: string;
  pdfUrl: string;
  tamanho: string;
  paginas: number;
  ano: number;
  tags: string[];
  downloads: number;
  avaliacao: number;
  isNovo?: boolean;
  isDestaque?: boolean;
}

type LivroCreateInput = Omit<Livro, 'id' | 'capa' | 'pdfUrl' | 'tamanho' | 'downloads' | 'avaliacao'>;

type LivroDoc = Omit<Livro, 'id'> & {
  capaStoragePath?: string;
  pdfStoragePath?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

const livrosCollection = collection(db, 'biblioteca_livros');

const mapDocToLivro = (id: string, data: any): Livro => {
  return {
    id,
    titulo: String(data?.titulo || ''),
    autor: String(data?.autor || ''),
    descricao: String(data?.descricao || ''),
    categoria: String(data?.categoria || ''),
    capa: String(data?.capa || ''),
    pdfUrl: String(data?.pdfUrl || ''),
    tamanho: String(data?.tamanho || ''),
    paginas: Number(data?.paginas || 0),
    ano: Number(data?.ano || 0),
    tags: Array.isArray(data?.tags) ? data.tags.map((t: any) => String(t)) : [],
    downloads: Number(data?.downloads || 0),
    avaliacao: Number(data?.avaliacao || 0),
    isNovo: Boolean(data?.isNovo),
    isDestaque: Boolean(data?.isDestaque),
  };
};

const guessFileExt = (file: File, fallback: string) => {
  const name = String(file.name || '');
  const lastDot = name.lastIndexOf('.');
  if (lastDot > -1 && lastDot < name.length - 1) {
    return name.slice(lastDot + 1).toLowerCase();
  }
  const mime = String(file.type || '').toLowerCase();
  if (mime.includes('pdf')) return 'pdf';
  if (mime.includes('png')) return 'png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('webp')) return 'webp';
  return fallback;
};

export const booksService = {
  async list(): Promise<Livro[]> {
    const snapshot = await getDocs(livrosCollection);
    return snapshot.docs.map((d) => mapDocToLivro(d.id, d.data()));
  },

  async incrementDownloads(id: string): Promise<void> {
    await updateDoc(doc(db, 'biblioteca_livros', id), {
      downloads: increment(1),
      updatedAt: serverTimestamp(),
    } as any);
  },

  async create(input: LivroCreateInput, pdfFile: File, coverFile: File): Promise<Livro> {
    console.log('BooksService.create - iniciando criação do livro');
    const baseDoc: Partial<LivroDoc> = {
      titulo: input.titulo,
      autor: input.autor,
      descricao: input.descricao,
      categoria: input.categoria,
      paginas: input.paginas,
      ano: input.ano,
      tags: input.tags,
      isNovo: input.isNovo,
      isDestaque: input.isDestaque,
      downloads: 0,
      avaliacao: 0,
      capa: '',
      pdfUrl: '',
      tamanho: `${(pdfFile.size / 1024 / 1024).toFixed(1)} MB`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log('BooksService.create - criando documento no Firestore');
    const created = await withTimeout('Criação do livro (Firestore)', addDoc(livrosCollection, baseDoc), 20000);
    const livroId = created.id;

    const pdfExt = guessFileExt(pdfFile, 'pdf');
    const coverExt = guessFileExt(coverFile, 'jpg');

    const pdfPath = `biblioteca/livros/${livroId}/arquivo.${pdfExt}`;
    const coverPath = `biblioteca/livros/${livroId}/capa.${coverExt}`;

    const pdfRef = storageRef(firebaseStorage, pdfPath);
    const coverRef = storageRef(firebaseStorage, coverPath);

    // Preflight: validar rapidamente se o Storage está acessível para escrita
    // (evita ficar preso 90s tentando subir um PDF grande quando a regra/bucket está incorreto)
    try {
      const pingRef = storageRef(firebaseStorage, `biblioteca/livros/${livroId}/__ping.txt`);
      await withTimeout(
        'Verificação de permissão no Storage',
        uploadBytes(pingRef, new Blob(['ok'], { type: 'text/plain' }), { contentType: 'text/plain' }),
        10000
      );
      deleteObject(pingRef).catch(() => {});
    } catch (e) {
      await deleteDoc(doc(db, 'biblioteca_livros', livroId)).catch(() => {});
      const message = e instanceof Error ? e.message : String(e);
      throw new Error(
        `Falha ao acessar o Storage para upload. Verifique as rules do Storage e o storageBucket. Detalhe: ${message}`
      );
    }

    console.log('BooksService.create - upload do PDF');
    await uploadResumableWithTimeout(
      'Upload do PDF (Storage)',
      pdfRef,
      pdfFile,
      { contentType: pdfFile.type || 'application/pdf' },
      180000
    );

    console.log('BooksService.create - upload da capa');
    await uploadResumableWithTimeout(
      'Upload da capa (Storage)',
      coverRef,
      coverFile,
      { contentType: coverFile.type || 'image/jpeg' },
      60000
    );

    console.log('BooksService.create - obtendo URLs do Storage');
    const [pdfUrl, capaUrl] = await withTimeout(
      'Obtenção das URLs (Storage)',
      Promise.all([getDownloadURL(pdfRef), getDownloadURL(coverRef)]),
      20000
    );

    const update: Partial<LivroDoc> = {
      pdfUrl,
      capa: capaUrl,
      pdfStoragePath: pdfPath,
      capaStoragePath: coverPath,
      updatedAt: serverTimestamp(),
    };

    console.log('BooksService.create - atualizando documento no Firestore');
    await withTimeout('Atualização do livro (Firestore)', updateDoc(doc(db, 'biblioteca_livros', livroId), update), 20000);

    console.log('BooksService.create - finalizado com sucesso');

    return mapDocToLivro(livroId, { ...baseDoc, ...update });
  },

  async updateMetadata(id: string, patch: Partial<Omit<Livro, 'id' | 'capa' | 'pdfUrl'>>): Promise<void> {
    await updateDoc(doc(db, 'biblioteca_livros', id), {
      ...patch,
      updatedAt: serverTimestamp(),
    } as any);
  },

  async delete(id: string): Promise<void> {
    const refDoc = doc(db, 'biblioteca_livros', id);
    const found = await getDoc(refDoc);
    const data = found.exists() ? (found.data() as any) : undefined;

    const capaPath = String(data?.capaStoragePath || '');
    const pdfPath = String(data?.pdfStoragePath || '');

    await deleteDoc(refDoc);

    const deletions: Promise<any>[] = [];
    if (capaPath) {
      deletions.push(deleteObject(storageRef(firebaseStorage, capaPath)).catch(() => {}));
    }
    if (pdfPath) {
      deletions.push(deleteObject(storageRef(firebaseStorage, pdfPath)).catch(() => {}));
    }
    await Promise.all(deletions);
  },
};
