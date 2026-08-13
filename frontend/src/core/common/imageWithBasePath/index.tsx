
import { img_path} from '../../../environment';

interface Image {
  className?: string;
  src: string;
  alt?: string;
  height?: number;
  width?: number;
  id?:string;
}

const ImageWithBasePath = (props: Image) => {
  // Combine the base path and the provided src to create the full image source URL
  let fullSrc = `${img_path}${props.src}`;

  // Global fix for backend uploaded images passed as assets/img/users/uploads/...
  if (props.src && props.src.includes('uploads/')) {
    const uploadPath = props.src.substring(props.src.indexOf('uploads/'));
    const backendUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : 'https://api.aaups.com');
    fullSrc = `${backendUrl}/${uploadPath}`;
  } else if (props.src && props.src.startsWith('http')) {
    fullSrc = props.src;
  }

  return (
    <img
      className={props.className}
      src={fullSrc}
      height={props.height}
      alt={props.alt}
      width={props.width}
      id={props.id}
      onError={(e: any) => {
        // Fallback to default user image on error
        if (!e.target.src.includes('user-01.jpg')) {
           e.target.src = `${img_path}assets/img/users/user-01.jpg`;
        }
      }}
    />
  );
};

export default ImageWithBasePath;
