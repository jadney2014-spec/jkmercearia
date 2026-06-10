import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'video';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'Resgate - Um lugar de fé, comunidade e transparência',
  description = 'Resgate em Brasília-DF. Cultos, estudos bíblicos, ministérios e muito mais. Venha fazer parte da nossa família!',
  keywords = 'igreja, brasília, resgate, culto, estudos bíblicos, ministérios, célula, fé, esperança',
  image = '/img/ICONE-RESGATE.png',
  url,
  type = 'website',
  author = 'Resgate',
  publishedTime,
  modifiedTime
}) => {
  const siteName = 'Resgate';
  const siteUrl = 'https://comunidadecresgate.com.br';
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : siteUrl);
  const fullImageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;
  const fullUrl = currentUrl.startsWith('http') ? currentUrl : `${siteUrl}${currentUrl}`;

  useEffect(() => {
    // Update title
    document.title = title;

    // Helper function to update or create meta tag
    const updateMetaTag = (name: string, content: string, property = false) => {
      const attribute = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    // Helper function to update or create link tag
    const updateLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      
      if (!element) {
        element = document.createElement('link');
        element.rel = rel;
        document.head.appendChild(element);
      }
      element.href = href;
    };

    // Basic Meta Tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('author', author);
    updateLinkTag('canonical', fullUrl);

    // Open Graph / Facebook
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:url', fullUrl, true);
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', fullImageUrl, true);
    updateMetaTag('og:site_name', siteName, true);
    updateMetaTag('og:locale', 'pt_BR', true);

    // Twitter Card
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:url', fullUrl);
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', fullImageUrl);

    // Article specific
    if (type === 'article') {
      if (publishedTime) updateMetaTag('article:published_time', publishedTime, true);
      if (modifiedTime) updateMetaTag('article:modified_time', modifiedTime, true);
      updateMetaTag('article:author', author, true);
    }

    // Additional Meta Tags
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('googlebot', 'index, follow');

    // Structured Data (JSON-LD) - Remove old and add new
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());

    // Organization Schema
    const organizationScript = document.createElement('script');
    organizationScript.type = 'application/ld+json';
    organizationScript.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: siteName,
      url: siteUrl,
      logo: `${siteUrl}/img/ICONE-RESGATE.png`,
      description: description,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Quadra 38, Área Especial, Lote E',
        addressLocality: 'Vila São José',
        addressRegion: 'DF',
        postalCode: '72010-010',
        addressCountry: 'BR'
      },
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'cresgate012@gmail.com',
        contactType: 'customer service'
      },
      sameAs: [
        'https://www.facebook.com/comunidadecresgate/',
        'https://www.instagram.com/comunidadecresgate/',
        'https://youtube.com/@comunidadecresgate'
      ]
    });
    document.head.appendChild(organizationScript);

    // LocalBusiness Schema
    const placeScript = document.createElement('script');
    placeScript.type = 'application/ld+json';
    placeScript.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: siteName,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Quadra 38, Área Especial, Lote E',
        addressLocality: 'Vila São José',
        addressRegion: 'DF',
        postalCode: '72010-010',
        addressCountry: 'BR'
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: '-15.7942',
        longitude: '-47.8822'
      }
    });
    document.head.appendChild(placeScript);
  }, [title, description, keywords, image, fullUrl, type, author, publishedTime, modifiedTime, siteName, siteUrl, fullImageUrl]);

  return null;
};

export default SEOHead;

