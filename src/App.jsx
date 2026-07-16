import React, { useState, useEffect } from 'react';
import { ValidacionesGlobales } from './validaciones';

const API_BASE = "https://methodya.vercel.app/api";

export default function App() {
  const [session, setSession] = useState(null);
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [errorLogin, setErrorLogin] = useState("");
  
  // Navigation / Contexts
  const [proySeleccionado, setProySeleccionado] = useState(null);
  const [docSeleccionado, setDocSeleccionado] = useState(null);
  const [docData, setDocData] = useState({ meta: {}, estructura: [], valores: {}, comentarios: [] });

  // Inputs Dinámicos
  const [valoresForm, setValoresForm] = useState({});
  const [erroresCampos, setErroresCampos] = useState({});
  
  // Estados de Comentarios
  const [comentarioTexto, setComentarioTexto] = useState("");
  const [campoComentando, setCampoComentando] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorLogin("");
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, clave })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error de autenticación");
      setSession(data);
    } catch (err) {
      setErrorLogin(err.message);
    }
  };

  const cargarDocumento = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/documentos/${id}`);
      const data = await res.json();
      setDocData(data);
      setValoresForm(data.valores || {});
      setDocSeleccionado(id);
    } catch (err) {
      alert("Error al cargar la persistencia híbrida del documento.");
    }
  };

  const validarCampoLocal = (variable, valor, campoConfig) => {
    let msg = ValidacionesGlobales.requerido(valor);
    if (msg) return msg;

    if (campoConfig.tipo === 'parrafo_predefinido' && valor.length < 20) {
      return ValidacionesGlobales.longitudMinima(20)(valor);
    }
    return null;
  };

  const handleGuardarParcial = async () => {
    let errores = {};
    docData.estructura.forEach(sec => {
      sec.campos.forEach(c => {
        const err = validarCampoLocal(c.variable, valoresForm[c.variable], c);
        if (err) errores[c.variable] = err;
      });
    });

    setErroresCampos(errores);
    if (Object.keys(errores).length > 0) {
      alert("Corrija las validaciones locales antes de transmitir.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/documentos/guardar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId: docSeleccionado, valores_campos: valoresForm })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(data.mensaje);
    } catch (err) {
      alert(err.message);
    }
  };

  const agregarComentario = async (variable) => {
    if (!comentarioTexto.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/documentos/comentario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docId: docSeleccionado,
          campo_variable: variable,
          autor: session.correo,
          comentario: comentarioTexto
        })
      });
      if (res.ok) {
        setComentarioTexto("");
        setCampoComentando(null);
        cargarDocumento(docSeleccionado);
      }
    } catch (err) {
      alert("Error al guardar la observación.");
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-[#092241] flex items-center justify-center p-6 font-sans">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#092241]">Software Methodya</h1>
            <p className="text-gray-500 text-sm">El puente empático hacia el aprendizaje real</p>
          </div>
          {errorLogin && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{errorLogin}</div>}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1 text-gray-700">Correo Corporativo</label>
            <input type="email" value={correo} onChange={e => setCorreo(e.target.value)} required className="w-full p-2 border rounded focus:outline-[#6194e6]" />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-1 text-gray-700">Contraseña</label>
            <input type="password" value={clave} onChange={e => setClave(e.target.value)} required className="w-full p-2 border rounded focus:outline-[#6194e6]" />
          </div>
          <button type="submit" className="w-full bg-[#6194e6] text-white p-2 rounded font-bold hover:bg-[#4a81d4] transition">Ingresar a la Plataforma</button>
        </form>
      </div>
    );
  }

  const isReadOnly = ['Detenido', 'Finalizado', 'Eliminado'].includes(proySeleccionado?.estado) || 
                     ['Revisión Pedagógica', 'Revisión Estilo', 'Detenido', 'Finalizado', 'Eliminado'].includes(docData?.meta?.estado);

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-[#092241] text-white p-4 flex justify-between items-center shadow-md">
        <div>
          <span className="font-bold text-lg">Methodya Core Beta</span>
          <span className="ml-3 text-xs bg-blue-500 px-2 py-0.5 rounded-full">{session.nombre} ({session.correo})</span>
        </div>
        <button onClick={() => setSession(null)} className="text-sm bg-gray-700 px-3 py-1 rounded hover:bg-gray-600">Cerrar Sesión</button>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar Proyectos/Documentos */}
        <aside className="w-64 bg-white border-r p-4 space-y-4 shadow-sm">
          <h2 className="font-bold text-gray-700 border-b pb-2">Mis Proyectos Asignados</h2>
          <div className="space-y-1">
            {session.proyectosAsignados.map(p => (
              <button key={p.id} onClick={() => { setProySeleccionado(p); setDocSeleccionado(null); }} className={`w-full text-left p-2 rounded text-sm font-medium transition ${proySeleccionado?.id === p.id ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'hover:bg-gray-50 text-gray-600'}`}>
                <div className="flex justify-between">{p.nombre} <span className="text-xs text-gray-400">{p.codigo}</span></div>
                <div className="text-[10px] text-gray-400">Rol: {p.rol} | Estado: {p.estado}</div>
              </button>
            ))}
          </div>

          {proySeleccionado && (
            <div className="mt-6 pt-4 border-t">
              <h3 className="font-bold text-xs text-gray-400 tracking-wider uppercase mb-2">Documentos del Proyecto</h3>
              <button onClick={() => cargarDocumento(1)} className="w-full text-left p-2 bg-gray-100 hover:bg-gray-200 text-xs rounded font-medium text-gray-700">
                📄 CLAS-BIO-001 (Clase de Biología)
              </button>
            </div>
          )}
        </aside>

        {/* Workspace Central / Modo Ejecución Formulario */}
        <main className="flex-1 p-8 overflow-y-auto">
          {docSeleccionado ? (
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex justify-between items-center border-b pb-4 mb-6">
                <div>
                  <h1 className="text-xl font-bold text-gray-800">{docData.meta.formulario?.nombre}</h1>
                  <p className="text-xs text-gray-400">Código del Entregable: {docData.meta.codigo} | Estado del Flujo: <span className="font-semibold text-orange-600">{docData.meta.estado}</span></p>
                </div>
                <div className="space-x-2">
                  <button onClick={handleGuardarParcial} disabled={isReadOnly} className={`px-4 py-2 rounded text-xs font-bold text-white transition ${isReadOnly ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
                    {isReadOnly ? "🚫 Modo Solo Lectura" : "💾 Guardar Avance Físico"}
                  </button>
                </div>
              </div>

              {/* Renderizador de Secciones Dinámicas NoSQL */}
              <div className="space-y-6">
                {docData.estructura.map((seccion) => (
                  <div key={seccion.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-bold text-sm text-[#092241] mb-4 uppercase tracking-wider">{seccion.titulo}</h3>
                    <div className="space-y-4">
                      {seccion.campos.map((campo) => (
                        <div key={campo.variable} className="bg-white p-3 rounded border shadow-sm relative">
                          <label className="block text-xs font-bold text-gray-700 mb-1">{campo.label} <span className="text-blue-500">({campo.variable})</span></label>
                          
                          <textarea
                            disabled={isReadOnly}
                            value={valoresForm[campo.variable] || ""}
                            onChange={(e) => setValoresForm({ ...valoresForm, [campo.variable]: e.target.value })}
                            className="w-full p-2 border text-sm rounded focus:outline-blue-400 disabled:bg-gray-50"
                            rows={3}
                          />
                          {erroresCampos[campo.variable] && <p className="text-red-500 text-[11px] mt-0.5">{erroresCampos[campo.variable]}</p>}

                          {/* Sección de Hilo de Comentarios Cruzados por Campo */}
                          <div className="mt-2 pt-2 border-t border-dashed">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-gray-400 uppercase tracking-widest">Observaciones de Co-evaluación</span>
                              <button onClick={() => setCampoComentando(campoComentando === campo.variable ? null : campo.variable)} className="text-[10px] text-blue-600 hover:underline font-semibold">+ Dejar Observación</button>
                            </div>
                            
                            {campoComentando === campo.variable && (
                              <div className="mt-2 flex gap-2">
                                <input type="text" placeholder="Escribe tu nota técnica o etiqueta..." value={comentarioTexto} onChange={e => setComentarioTexto(e.target.value)} className="flex-1 p-1 border text-xs rounded" />
                                <button onClick={() => agregarComentario(campo.variable)} className="bg-blue-600 text-white px-2 py-1 text-xs rounded font-bold">Indexar</button>
                              </div>
                            )}

                            <div className="space-y-1 mt-2">
                              {docData.comentarios.filter(c => c.campo_variable === campo.variable).map((c, i) => (
                                <div key={i} className="bg-amber-50 p-1.5 rounded border border-amber-200 text-xs">
                                  <span className="font-bold text-amber-900">{c.autor}:</span> <span className="text-amber-800">{c.comentario}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <span className="text-5xl mb-2">📁</span>
              <p className="text-sm">Selecciona un proyecto y abre un documento para desplegar los subformularios dinámicos de Methodya.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}