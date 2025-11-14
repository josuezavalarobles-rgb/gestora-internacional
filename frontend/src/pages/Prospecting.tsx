import { useState } from 'react';
import { Search, Building2, Mail, Phone, Linkedin, Globe, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { useSmartEnrich, useProspectingStatus } from '@/hooks/useProspecting';
import type { SmartEnrichResult } from '@/types';

export default function Prospecting() {
  const [companyDomain, setCompanyDomain] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [useHunter, setUseHunter] = useState(true);
  const [useApollo, setUseApollo] = useState(true);

  const { data: status } = useProspectingStatus();
  const smartEnrich = useSmartEnrich();
  const [results, setResults] = useState<SmartEnrichResult | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyDomain) {
      alert('Por favor ingresa el dominio de la empresa');
      return;
    }

    try {
      const data = await smartEnrich.mutateAsync({
        companyDomain,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        useHunter,
        useApollo,
      });
      setResults(data);
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleClear = () => {
    setCompanyDomain('');
    setFirstName('');
    setLastName('');
    setResults(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prospección Inteligente</h1>
          <p className="text-slate-600">Busca y enriquece datos de empresas y contactos</p>
        </div>
      </div>

      {/* Service Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`bg-white rounded-lg shadow border p-4 ${status?.hunter?.configured ? 'border-green-200' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Mail size={20} className="text-blue-600" />
                <span className="font-semibold text-slate-900">Hunter.io</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {status?.hunter?.configured ? 'Verificación de emails' : 'No configurado'}
              </p>
            </div>
            {status?.hunter?.configured ? (
              <Check size={24} className="text-green-500" />
            ) : (
              <X size={24} className="text-gray-400" />
            )}
          </div>
          {status?.hunter?.account && (
            <div className="mt-3 text-xs text-slate-600">
              <p>Disponibles: {status.hunter.account.calls?.available || 0}</p>
            </div>
          )}
        </div>

        <div className={`bg-white rounded-lg shadow border p-4 ${status?.apollo?.configured ? 'border-green-200' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Building2 size={20} className="text-purple-600" />
                <span className="font-semibold text-slate-900">Apollo.io</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {status?.apollo?.configured ? '275M+ contactos B2B' : 'No configurado'}
              </p>
            </div>
            {status?.apollo?.configured ? (
              <Check size={24} className="text-green-500" />
            ) : (
              <X size={24} className="text-gray-400" />
            )}
          </div>
          {status?.apollo?.account && (
            <div className="mt-3 text-xs text-slate-600">
              <p>Créditos: {status.apollo.account.credits?.available || 0}</p>
            </div>
          )}
        </div>

        <div className={`bg-white rounded-lg shadow border p-4 ${status?.phantombuster?.configured ? 'border-green-200' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Linkedin size={20} className="text-blue-700" />
                <span className="font-semibold text-slate-900">PhantomBuster</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {status?.phantombuster?.configured ? 'Automatización LinkedIn' : 'No configurado'}
              </p>
            </div>
            {status?.phantombuster?.configured ? (
              <Check size={24} className="text-green-500" />
            ) : (
              <X size={24} className="text-gray-400" />
            )}
          </div>
          {status?.phantombuster?.account && (
            <div className="mt-3 text-xs text-slate-600">
              <p>Tiempo: {Math.round((status.phantombuster.account.timeLeft || 0) / 60)} min</p>
            </div>
          )}
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Dominio de la Empresa <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Globe size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={companyDomain}
                onChange={(e) => setCompanyDomain(e.target.value)}
                placeholder="ejemplo: microsoft.com"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={smartEnrich.isPending}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Ingresa el dominio de la empresa sin "www" ni "https://"
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Nombre (Opcional)
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Juan"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={smartEnrich.isPending}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Apellido (Opcional)
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Pérez"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={smartEnrich.isPending}
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useHunter}
                onChange={(e) => setUseHunter(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={smartEnrich.isPending || !status?.hunter?.configured}
              />
              <span className="text-sm text-slate-700">Usar Hunter.io</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useApollo}
                onChange={(e) => setUseApollo(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={smartEnrich.isPending || !status?.apollo?.configured}
              />
              <span className="text-sm text-slate-700">Usar Apollo.io</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={smartEnrich.isPending || !companyDomain}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {smartEnrich.isPending ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search size={20} />
                  Buscar y Enriquecer
                </>
              )}
            </button>

            {results && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Limpiar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-4">
          {/* Company Info */}
          {results.company && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 size={20} className="text-purple-600" />
                Información de la Empresa
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Nombre</p>
                  <p className="font-semibold text-slate-900">{results.company.name}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-600">Sitio Web</p>
                  <a
                    href={`https://${results.company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    {results.company.website}
                  </a>
                </div>

                <div>
                  <p className="text-sm text-slate-600">Industria</p>
                  <p className="font-semibold text-slate-900">{results.company.industry}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-600">Empleados</p>
                  <p className="font-semibold text-slate-900">{results.company.employeeRange || results.company.employeeCount}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-600">Ubicación</p>
                  <p className="font-semibold text-slate-900">
                    {[results.company.city, results.company.state, results.company.country].filter(Boolean).join(', ')}
                  </p>
                </div>

                {results.company.founded && (
                  <div>
                    <p className="text-sm text-slate-600">Fundación</p>
                    <p className="font-semibold text-slate-900">{results.company.founded}</p>
                  </div>
                )}
              </div>

              {results.company.technologies && results.company.technologies.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-slate-600 mb-2">Tecnologías</p>
                  <div className="flex flex-wrap gap-2">
                    {results.company.technologies.map((tech, i) => (
                      <span key={i} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contact Info */}
          {results.contact && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Mail size={20} className="text-blue-600" />
                Información del Contacto
              </h2>

              <div className="space-y-3">
                {results.contact.email && (
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-slate-400" />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{results.contact.email}</p>
                      {results.contact.verified !== undefined && (
                        <div className="flex items-center gap-1 mt-1">
                          {results.contact.verified ? (
                            <>
                              <Check size={14} className="text-green-500" />
                              <span className="text-xs text-green-600">Verificado</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle size={14} className="text-orange-500" />
                              <span className="text-xs text-orange-600">No verificado</span>
                            </>
                          )}
                          {results.contact.confidence && (
                            <span className="text-xs text-slate-500 ml-2">
                              Confianza: {results.contact.confidence}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {results.contact.phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-slate-400" />
                    <p className="font-semibold text-slate-900">{results.contact.phone}</p>
                  </div>
                )}

                {results.contact.title && (
                  <div className="flex items-center gap-3">
                    <Building2 size={18} className="text-slate-400" />
                    <p className="font-semibold text-slate-900">{results.contact.title}</p>
                  </div>
                )}

                {results.contact.linkedinUrl && (
                  <div className="flex items-center gap-3">
                    <Linkedin size={18} className="text-slate-400" />
                    <a
                      href={results.contact.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      Ver perfil de LinkedIn
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Emails */}
          {results.emails && results.emails.length > 0 && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Mail size={20} className="text-blue-600" />
                Otros Emails Encontrados ({results.emails.length})
              </h2>

              <div className="space-y-2">
                {results.emails.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-slate-900">{item.email}</p>
                      <p className="text-sm text-slate-600">{item.position}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.verified ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <Check size={12} />
                          Verificado
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                          No verificado
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Sources */}
          {results.sources && results.sources.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Fuentes de datos:</strong> {results.sources.join(', ')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!results && !smartEnrich.isPending && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          <Search size={48} className="mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Comienza tu búsqueda
          </h3>
          <p className="text-slate-600 max-w-md mx-auto">
            Ingresa el dominio de una empresa y, opcionalmente, el nombre de un contacto
            para obtener información enriquecida desde múltiples fuentes.
          </p>
        </div>
      )}
    </div>
  );
}
