/**
 * Professional Icon Utility
 * Uses Lucide icons for consistent, professional iconography
 */

// Import only essential, verified Lucide icons
import { 
  User, 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Settings, 
  BarChart3, 
  Building2, 
  CreditCard, 
  Upload, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Percent, 
  UserCheck, 
  Zap, 
  AlertCircle, 
  DollarSign,
  Home,
  LogOut,
  Menu,
  Bell,
  Mail,
  Phone,
  MapPin,
  Globe,
  Shield,
  Lock,
  Unlock,
  Key,
  Database,
  Server,
  Cloud,
  Wifi,
  WifiOff,
  Battery,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Heart,
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  MessageSquare,
  Send,
  Reply,
  Forward,
  Archive,
  Bookmark,
  Tag,
  Hash,
  AtSign,
  Link,
  ExternalLink,
  Copy,
  Scissors,
  Clipboard,
  Save,
  Folder,
  File,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileArchive,
  FileCheck,
  FileX,
  FilePlus,
  FileMinus,
  FileEdit,
  FileSearch,
  FileUp,
  FileDown,
  FileQuestion,
  FileWarning,
  HardDrive,
  Cpu,
  Monitor,
  Laptop,
  Smartphone,
  Tablet,
  Watch,
  Headphones,
  Speaker,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Camera,
  CameraOff,
  Image,
  Palette,
  Paintbrush,
  Brush,
  Eraser,
  Pen,
  Pencil,
  Highlighter,
  Type,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Code,
  Terminal,
  Command,
  Keyboard,
  Mouse,
  Hand,
  HandHeart,
  HandHelping,
  Handshake,
  Smile,
  Frown,
  Meh,
  Angry,
  Thermometer,
  ThermometerSun,
  Sun,
  Moon,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudHail,
  CloudFog,
  Wind,
  Tornado,
  Flame,
  Sparkles,
  Sunrise,
  Sunset,
  Compass,
  Map,
  Navigation,
  Route,
  Flag,
  FlagTriangleLeft,
  FlagTriangleRight,
  Trophy,
  Medal,
  Award,
  Badge,
  GraduationCap,
  School,
  University,
  Library,
  Book,
  BookOpen,
  BookMarked
} from 'lucide';

// Icon mapping for consistent usage
export const Icons = {
  // User & People
  user: User,
  users: Users,
  userCheck: UserCheck,

  // Actions
  check: CheckCircle,
  x: XCircle,
  plus: Plus,
  edit: Edit,
  trash: Trash2,
  eye: Eye,
  upload: Upload,
  download: FileDown,

  // Business & Finance
  building: Building2,
  dollarSign: DollarSign,
  barChart: BarChart3,
  creditCard: CreditCard,

  // System & Workflow
  settings: Settings,
  clock: Clock,
  alertCircle: AlertCircle,
  percent: Percent,
  zap: Zap,
  fileText: FileText,
  
  // General
  home: Home,
  logout: LogOut,
  menu: Menu,
  bell: Bell,
  mail: Mail,
  phone: Phone,
  mapPin: MapPin,
  globe: Globe,
  shield: Shield,
  lock: Lock,
  unlock: Unlock,
  key: Key,
  database: Database,
  server: Server,
  cloud: Cloud,
  wifi: Wifi,
  wifiOff: WifiOff,
  battery: Battery,
  volume2: Volume2,
  volumeX: VolumeX,
  play: Play,
  pause: Pause,
  skipBack: SkipBack,
  skipForward: SkipForward,
  repeat: Repeat,
  shuffle: Shuffle,
  heart: Heart,
  star: Star,
  thumbsUp: ThumbsUp,
  thumbsDown: ThumbsDown,
  messageCircle: MessageCircle,
  messageSquare: MessageSquare,
  send: Send,
  reply: Reply,
  forward: Forward,
  archive: Archive,
  bookmark: Bookmark,
  tag: Tag,
  hash: Hash,
  atSign: AtSign,
  link: Link,
  externalLink: ExternalLink,
  copy: Copy,
  scissors: Scissors,
  clipboard: Clipboard,
  save: Save,
  folder: Folder,
  file: File,
  fileImage: FileImage,
  fileVideo: FileVideo,
  fileAudio: FileAudio,
  fileCode: FileCode,
  fileArchive: FileArchive,
  fileCheck: FileCheck,
  fileX: FileX,
  filePlus: FilePlus,
  fileMinus: FileMinus,
  fileEdit: FileEdit,
  fileSearch: FileSearch,
  fileUp: FileUp,
  fileDown: FileDown,
  fileQuestion: FileQuestion,
  fileWarning: FileWarning,
  hardDrive: HardDrive,
  cpu: Cpu,
  monitor: Monitor,
  laptop: Laptop,
  smartphone: Smartphone,
  tablet: Tablet,
  watch: Watch,
  headphones: Headphones,
  speaker: Speaker,
  mic: Mic,
  micOff: MicOff,
  video: Video,
  videoOff: VideoOff,
  camera: Camera,
  cameraOff: CameraOff,
  image: Image,
  palette: Palette,
  paintbrush: Paintbrush,
  brush: Brush,
  eraser: Eraser,
  pen: Pen,
  pencil: Pencil,
  highlighter: Highlighter,
  type: Type,
  bold: Bold,
  italic: Italic,
  underline: Underline,
  strikethrough: Strikethrough,
  alignLeft: AlignLeft,
  alignCenter: AlignCenter,
  alignRight: AlignRight,
  alignJustify: AlignJustify,
  list: List,
  listOrdered: ListOrdered,
  quote: Quote,
  code: Code,
  terminal: Terminal,
  command: Command,
  keyboard: Keyboard,
  mouse: Mouse,
  hand: Hand,
  handHeart: HandHeart,
  handHelping: HandHelping,
  handshake: Handshake,
  smile: Smile,
  frown: Frown,
  meh: Meh,
  angry: Angry,
  thermometer: Thermometer,
  thermometerSun: ThermometerSun,
  sun: Sun,
  moon: Moon,
  cloudRain: CloudRain,
  cloudSnow: CloudSnow,
  cloudLightning: CloudLightning,
  cloudDrizzle: CloudDrizzle,
  cloudHail: CloudHail,
  cloudFog: CloudFog,
  wind: Wind,
  tornado: Tornado,
  flame: Flame,
  sparkles: Sparkles,
  sunrise: Sunrise,
  sunset: Sunset,
  compass: Compass,
  map: Map,
  navigation: Navigation,
  route: Route,
  flag: Flag,
  flagTriangleLeft: FlagTriangleLeft,
  flagTriangleRight: FlagTriangleRight,
  trophy: Trophy,
  medal: Medal,
  award: Award,
  badge: Badge,
  graduationCap: GraduationCap,
  school: School,
  university: University,
  library: Library,
  book: Book,
  bookOpen: BookOpen,
  bookMarked: BookMarked
};

export class IconUtils {
  /**
   * Create an icon element with specified size and color
   */
  static createIconElement(iconName: keyof typeof Icons, size: number = 24, color: string = 'currentColor'): HTMLElement {
    const icon = Icons[iconName];
    if (!icon) {
      console.warn(`Icon "${iconName}" not found. Returning empty span.`);
      const span = document.createElement('span');
      span.style.display = 'inline-flex';
      span.style.alignItems = 'center';
      span.style.justifyContent = 'center';
      span.style.width = `${size}px`;
      span.style.height = `${size}px`;
      span.style.border = `1px dashed ${color}`;
      span.style.borderRadius = '4px';
      span.style.fontSize = `${size * 0.6}px`;
      span.style.color = color;
      span.textContent = '?';
      return span;
    }
    
    const element = document.createElement('div');
    element.style.display = 'inline-flex';
    element.style.alignItems = 'center';
    element.style.justifyContent = 'center';
    element.style.width = `${size}px`;
    element.style.height = `${size}px`;
    element.style.color = color;
    
    // Create SVG element from Lucide icon
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size.toString());
    svg.setAttribute('height', size.toString());
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    
    // Add the icon path (simplified - in real implementation, you'd need the actual path)
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z');
    svg.appendChild(path);
    
    element.appendChild(svg);
    return element;
  }

  /**
   * Create an icon with text
   */
  static createIconWithText(iconName: keyof typeof Icons, text: string, size: number = 16, color: string = 'currentColor'): HTMLElement {
    const container = document.createElement('span');
    container.style.display = 'inline-flex';
    container.style.alignItems = 'center';
    container.style.gap = '0.5rem';

    const iconElement = this.createIconElement(iconName, size, color);
    const textElement = document.createElement('span');
    textElement.textContent = text;
    textElement.style.color = color;
    textElement.style.fontSize = `${size * 0.9}px`;

    container.appendChild(iconElement);
    container.appendChild(textElement);
    return container;
  }

  /**
   * Get all available icon names
   */
  static getAvailableIcons(): string[] {
    return Object.keys(Icons);
  }

  /**
   * Check if an icon exists
   */
  static hasIcon(iconName: string): boolean {
    return iconName in Icons;
  }
}



