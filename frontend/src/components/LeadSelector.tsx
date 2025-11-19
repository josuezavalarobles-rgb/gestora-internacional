import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Search,
  Filter,
  CheckSquare,
  Square,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  User,
  Tag,
  TrendingUp
} from 'lucide-react';
import api from '@/services/api';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  classification: string;
  score: number;
  tags?: string[];
  metadata?: any;
  customFields?: any;
  deals?: Array<{
    assignedTo?: {
      id: string;
      name: string;
      lastName?: string;
    };
  }>;
}

interface LeadSelectorProps {
  onSelectLeads: (leads: Array<{ email: string; firstName?: string; lastName?: string; companyName?: string }>) => void;
  selectedCount: number;
}

export default function LeadSelector({ onSelectLeads, selectedCount }: LeadSelectorProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  // Filtros
  const [filterClassification, setFilterClassification] = useState<string>('ALL');
  const [filterMinScore, setFilterMinScore] = useState<number>(0);
  const [filterTags, setFilterTags] = useState<string>('');
  const [filterHasEmail, setFilterHasEmail] = useState<boolean>(true);

  // Fetch leads with filters
  const { data: leads = [], isLoading, refetch } = useQuery<Lead[]>({
    queryKey: ['leads-for-campaign', filterClassification, filterMinScore, filterTags, filterHasEmail],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filterHasEmail) {
        params.append('hasEmail', 'true');
      }

      if (filterClassification !== 'ALL') {
        params.append('classification', filterClassification);
      }

      if (filterMinScore > 0) {
        params.append('minScore', filterMinScore.toString());
      }

      if (filterTags) {
        params.append('tags', filterTags);
      }

      const response = await api.get(`/leads?${params.toString()}`);
      return response.data;
    },
  });

  // Filter leads by search term
  const filteredLeads = leads.filter((lead) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      lead.name?.toLowerCase().includes(term) ||
      lead.email?.toLowerCase().includes(term) ||
      lead.phone?.includes(term)
    );
  });

  // Get available tags from all leads
  const availableTags = Array.from(
    new Set(leads.flatMap((lead) => lead.tags || []))
  );

  const handleToggleLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map((l) => l.id)));
    }
  };

  const handleApplySelection = () => {
    const selected = leads
      .filter((lead) => selectedLeads.has(lead.id))
      .map((lead) => {
        // Extract firstName and lastName from name
        const nameParts = (lead.name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        return {
          email: lead.email || '',
          firstName,
          lastName,
          companyName: lead.metadata?.company || lead.customFields?.empresa || '',
        };
      })
      .filter((r) => r.email); // Solo incluir leads con email

    onSelectLeads(selected);
  };

  const handleClearFilters = () => {
    setFilterClassification('ALL');
    setFilterMinScore(0);
    setFilterTags('');
    setFilterHasEmail(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="text-purple-400" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-white">Seleccionar de la Cartera</h3>
            <p className="text-sm text-slate-400">
              {filteredLeads.length} leads disponibles | {selectedLeads.size} seleccionados
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          <Filter size={18} />
          Filtros
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Classification Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} />
                  Clasificación
                </div>
              </label>
              <select
                value={filterClassification}
                onChange={(e) => setFilterClassification(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">Todas</option>
                <option value="HOT">🔥 Caliente (HOT)</option>
                <option value="WARM">☀️ Tibio (WARM)</option>
                <option value="COLD">❄️ Frío (COLD)</option>
              </select>
            </div>

            {/* Score Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} />
                  Score Mínimo: {filterMinScore}
                </div>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={filterMinScore}
                onChange={(e) => setFilterMinScore(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Tags Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <div className="flex items-center gap-2">
                  <Tag size={16} />
                  Etiqueta
                </div>
              </label>
              <select
                value={filterTags}
                onChange={(e) => setFilterTags(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Todas</option>
                {availableTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>

            {/* Has Email Filter */}
            <div className="flex items-center gap-2 md:col-span-2">
              <input
                type="checkbox"
                id="hasEmail"
                checked={filterHasEmail}
                onChange={(e) => setFilterHasEmail(e.target.checked)}
                className="w-4 h-4 bg-slate-900 border-slate-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="hasEmail" className="text-sm text-slate-300">
                Solo mostrar leads con email válido
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Limpiar Filtros
            </button>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por nombre, email o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Select All */}
      <div className="flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-lg">
        <button
          onClick={handleSelectAll}
          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
        >
          {selectedLeads.size === filteredLeads.length ? (
            <CheckSquare size={20} />
          ) : (
            <Square size={20} />
          )}
          <span className="font-medium">
            {selectedLeads.size === filteredLeads.length ? 'Deseleccionar' : 'Seleccionar'} todos
          </span>
        </button>
      </div>

      {/* Leads List */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              <p className="mt-4">Cargando leads...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>No se encontraron leads con los filtros seleccionados</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-900 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    <Square size={16} className="opacity-0" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Clasificación
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Asignado a
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className={`hover:bg-slate-700 cursor-pointer transition-colors ${
                      selectedLeads.has(lead.id) ? 'bg-purple-900/20' : ''
                    }`}
                    onClick={() => handleToggleLead(lead.id)}
                  >
                    <td className="px-4 py-3">
                      {selectedLeads.has(lead.id) ? (
                        <CheckSquare size={20} className="text-purple-400" />
                      ) : (
                        <Square size={20} className="text-slate-600" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{lead.name || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{lead.email || '-'}</td>
                    <td className="px-4 py-3 text-slate-400">{lead.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          lead.classification === 'HOT'
                            ? 'bg-red-500/20 text-red-400'
                            : lead.classification === 'WARM'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {lead.classification}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{lead.score}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {lead.deals?.[0]?.assignedTo
                        ? `${lead.deals[0].assignedTo.name} ${lead.deals[0].assignedTo.lastName || ''}`
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center p-4 bg-slate-800 border border-slate-700 rounded-lg">
        <div className="text-slate-300">
          <span className="font-semibold text-white">{selectedLeads.size}</span> leads seleccionados
          {selectedCount > 0 && (
            <span className="ml-2 text-green-400">
              (+{selectedCount} de archivo CSV)
            </span>
          )}
        </div>
        <button
          onClick={handleApplySelection}
          disabled={selectedLeads.size === 0}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
        >
          Usar {selectedLeads.size} leads seleccionados
        </button>
      </div>
    </div>
  );
}
