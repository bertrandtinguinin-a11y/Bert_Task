import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGaugeHigh, faClipboardList, faChartLine, faChartColumn, faRobot, faGear,
  faUser, faUserPlus, faSun, faMoon, faXmark, faPlus, faFileExport, faFileCsv,
  faPenToSquare, faTrashCan, faMagnifyingGlass, faCircleCheck, faCheck, faArrowsRotate,
  faPen, faBan, faCalendarDay, faRocket, faComment, faTriangleExclamation,
  faArrowRightLong, faArrowLeftLong, faArrowUp, faArrowDown, faFloppyDisk,
  faBell, faCircleInfo, faTableColumns, faTableList, faSpinner, faRightToBracket,
  faCloud, faBullseye, faThumbsUp, faWandMagicSparkles, faLightbulb,
  faClockRotateLeft, faCircle, faThumbtack, faInbox, faCircleExclamation,
} from '@fortawesome/free-solid-svg-icons'

// Mapping nom logique -> icône Font Awesome (rendu vectoriel, cohérent, sobre)
const MAP = {
  dashboard: faGaugeHigh,
  tasks: faClipboardList,
  synthesis: faChartLine,
  chart: faChartColumn,
  ai: faRobot,
  settings: faGear,
  user: faUser,
  'user-plus': faUserPlus,
  sun: faSun,
  moon: faMoon,
  close: faXmark,
  plus: faPlus,
  export: faFileExport,
  csv: faFileCsv,
  edit: faPenToSquare,
  delete: faTrashCan,
  search: faMagnifyingGlass,
  done: faCircleCheck,
  check: faCheck,
  progress: faArrowsRotate,
  todo: faPen,
  blocked: faBan,
  calendar: faCalendarDay,
  start: faRocket,
  comment: faComment,
  warning: faTriangleExclamation,
  'arrow-right': faArrowRightLong,
  back: faArrowLeftLong,
  'sort-up': faArrowUp,
  'sort-down': faArrowDown,
  save: faFloppyDisk,
  bell: faBell,
  info: faCircleInfo,
  cards: faTableColumns,
  table: faTableList,
  spinner: faSpinner,
  login: faRightToBracket,
  cloud: faCloud,
  target: faBullseye,
  thumbsup: faThumbsUp,
  sparkles: faWandMagicSparkles,
  lightbulb: faLightbulb,
  history: faClockRotateLeft,
  dot: faCircle,
  pin: faThumbtack,
  empty: faInbox,
  alert: faCircleExclamation,
}

export default function Icon({ name, className = '', spin = false, fixedWidth = false }) {
  const def = MAP[name]
  if (!def) return null
  return <FontAwesomeIcon icon={def} className={className} spin={spin} fixedWidth={fixedWidth} />
}
