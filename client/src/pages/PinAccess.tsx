import { Navigate } from 'react-router-dom';
import { appPath } from '../constants/app';

export default function PinAccess() {
  return <Navigate to={appPath('welcome')} replace />;
}
