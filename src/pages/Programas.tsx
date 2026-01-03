import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../services/api'

interface Programa {
  idPrograma: string
  titulo: string
  descripcion?: string
  nivelDificultad?: string
  duracionSemanas?: number
  imagenUrl?: string
  categoria?: {
    nombre: string
  }
  entrenamientos?: {
    idEntrenamiento: string
    nombre: string
  }[]
}

export default function Programas() {
  const [programas, setProgramas] = useState<Programa[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPrograma, setSelectedPrograma] = useState<Programa | null>(null)

  const fetchProgramas = async () => {
    setLoading(true)
    try {
      const response = await api.get('/programas', { params: { limit: 100 } })
      setProgramas(response.data.programas || [])
    } catch (error: any) {
      console.error('Error al cargar programas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProgramas()
  }, [])

  const fetchProgramaDetails = async (id: string) => {
    try {
      const response = await api.get(`/programas/${id}`)
      setSelectedPrograma(response.data)
    } catch (error: any) {
      console.error('Error al cargar detalles del programa:', error)
    }
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Programas</h1>
          <p className="mt-2 text-gray-600">Visualiza los programas de entrenamiento</p>
        </div>

        {loading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programas.map((programa) => (
              <div
                key={programa.idPrograma}
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => fetchProgramaDetails(programa.idPrograma)}
              >
                {programa.imagenUrl && (
                  <img
                    src={programa.imagenUrl}
                    alt={programa.titulo}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                <h3 className="text-xl font-semibold mb-2">{programa.titulo}</h3>
                {programa.descripcion && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{programa.descripcion}</p>
                )}
                <div className="flex justify-between items-center text-sm text-gray-500">
                  {programa.nivelDificultad && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {programa.nivelDificultad}
                    </span>
                  )}
                  {programa.duracionSemanas && <span>📅 {programa.duracionSemanas} semanas</span>}
                </div>
                {programa.categoria && (
                  <div className="mt-2 text-sm text-gray-500">📁 {programa.categoria.nombre}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedPrograma && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedPrograma.titulo}</h2>
                <button
                  onClick={() => setSelectedPrograma(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {selectedPrograma.imagenUrl && (
                <img
                  src={selectedPrograma.imagenUrl}
                  alt={selectedPrograma.titulo}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
              )}

              {selectedPrograma.descripcion && (
                <p className="text-gray-600 mb-4">{selectedPrograma.descripcion}</p>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                {selectedPrograma.nivelDificultad && (
                  <div>
                    <span className="font-semibold">Nivel:</span>{' '}
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {selectedPrograma.nivelDificultad}
                    </span>
                  </div>
                )}
                {selectedPrograma.duracionSemanas && (
                  <div>
                    <span className="font-semibold">Duración:</span> {selectedPrograma.duracionSemanas}{' '}
                    semanas
                  </div>
                )}
                {selectedPrograma.categoria && (
                  <div>
                    <span className="font-semibold">Categoría:</span> {selectedPrograma.categoria.nombre}
                  </div>
                )}
              </div>

              {selectedPrograma.entrenamientos && selectedPrograma.entrenamientos.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-2">Entrenamientos</h3>
                  <ul className="space-y-2">
                    {selectedPrograma.entrenamientos.map((entrenamiento) => (
                      <li key={entrenamiento.idEntrenamiento} className="flex items-center">
                        <span className="mr-2">💪</span>
                        {entrenamiento.nombre}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

