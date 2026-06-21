import Icon from './icon'

const STATUS_OPTIONS = ['', 'À faire', 'En cours', 'Réalisé', 'À traiter', 'À planifier', 'Bloqué']
const PRIORITY_OPTIONS = ['', 'Haute', 'Moyenne', 'Basse']
const THEME_OPTIONS = [
  '',
  'Cabinet – Retraite',
  'Communication / Multimédia',
  'Fabrice Kopore',
  'Florentine / SNV',
  'Facilitateurs(ce) SNV / Rapports',
  'Situation de référence Formation Microentrepreneur C2',
  'Maguerite',
  'Formation en S&E et IA intégré',
  'Formation en EIES',
  'Mail Professionnel',
]

export default function FilterBar({ filters, onFilterChange, showSearch = true }) {
  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    onFilterChange({})
  }

  const hasFilters = Object.values(filters).some(v => v)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {showSearch && (
          <div className="relative max-w-xs w-full">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={filters.search || ''}
              onChange={e => handleChange('search', e.target.value)}
              className="input-field text-sm pl-9 w-full"
            />
          </div>
        )}
        <select
          value={filters.status || ''}
          onChange={e => handleChange('status', e.target.value)}
          className="input-field max-w-[140px] text-sm"
        >
          <option value="">Tous statuts</option>
          {STATUS_OPTIONS.slice(1).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filters.priority || ''}
          onChange={e => handleChange('priority', e.target.value)}
          className="input-field max-w-[130px] text-sm"
        >
          <option value="">Toutes priorités</option>
          {PRIORITY_OPTIONS.slice(1).map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={filters.theme || ''}
          onChange={e => handleChange('theme', e.target.value)}
          className="input-field max-w-[200px] text-sm"
        >
          <option value="">Tous les thèmes</option>
          {THEME_OPTIONS.slice(1).map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {hasFilters && (
          <button onClick={clearFilters} className="btn-secondary text-sm py-1.5 inline-flex items-center gap-1.5">
            <Icon name="close" /> Effacer
          </button>
        )}
      </div>
      {showSearch && (
        <div className="relative max-w-xs w-full">
          <Icon name="user" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
          <input
            type="text"
            placeholder="Filtrer par responsable..."
            value={filters.responsible || ''}
            onChange={e => handleChange('responsible', e.target.value)}
            className="input-field text-sm pl-9 w-full"
          />
        </div>
      )}
    </div>
  )
}
