"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";

export function ArtesDroppart() {
  const [categorias, setCategorias] = useState([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState("");
  const [imagensCarregadas, setImagensCarregadas] = useState(new Set());

  useEffect(() => {
    async function loadCategorias() {
      try {
        const response = await axios.get(
          "https://api.innovationbrindes.com.br/api/site/v2/controle-crm/listar-grupos-categoria"
        );

        setCategorias(response.data.dados);
        setCategoriaAtiva(response.data.dados[0]?.categoria || "");
      } catch (err) {
        console.error("Erro ao carregar categorias", err);
      }
    }

    loadCategorias();
  }, []);

  const categoriaSelecionada = useMemo(
    () => categorias.find((c) => c.categoria === categoriaAtiva),
    [categorias, categoriaAtiva]
  );

  const handleImageLoad = useCallback((id) => {
    setImagensCarregadas((prev) => new Set(prev).add(id));
  }, []);

  const handleRecusar = useCallback(async (imagemId) => {
    try {
      await axios.put(
        "https://api.innovationbrindes.com.br/api/site/v2/controle-crm/marcar-categoria-errada",
        {},
        { params: { id: imagemId } }
      );

      setCategorias((prev) =>
        prev.map((cat) => ({
          ...cat,
          grupos: Object.fromEntries(
            Object.entries(cat.grupos).map(([grupoId, imagens]) => [
              grupoId,
              imagens.filter((img) => img.id !== imagemId),
            ])
          ),
        }))
      );
    } catch (err) {
      console.error("Erro ao marcar categoria errada", err);
    }
  }, []);

  return (
    <div className="p-5">
      <h2 className="text-xl font-bold mb-4">Artes disponíveis</h2>

      {/* FILTRO */}
      <div className="flex flex-wrap gap-3 mb-6">
        {categorias.map((cat) => (
          <button
            key={cat.categoria}
            onClick={() => setCategoriaAtiva(cat.categoria)}
            className={`px-4 py-2 rounded-lg border transition 
              ${
                categoriaAtiva === cat.categoria
                  ? "bg-gray-800 text-white border-gray-800"
                  : "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"
              }`}
          >
            {cat.categoria} ({cat.total_grupos})
          </button>
        ))}
      </div>

      {/* LISTA DE GRUPOS */}
      {categoriaSelecionada ? (
        Object.entries(categoriaSelecionada.grupos).map(([grupoId, imagens]) => (
          <GrupoCard
            key={grupoId}
            grupoId={grupoId}
            imagens={imagens}
            onRecusar={handleRecusar}
            onImageLoad={handleImageLoad}
          />
        ))
      ) : (
        <p>Carregando dados...</p>
      )}
    </div>
  );
}

/*  GRUPO CARD */
function GrupoCard({ grupoId, imagens, onRecusar, onImageLoad }) {
  return (
    <div className="border border-gray-300 rounded-xl p-4 mb-6 bg-gray-50 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">Grupo: {grupoId}</h3>
      </div>

      {/* GRID 4 IMAGENS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {imagens.slice(0, 4).map((img) => (
          <ImagemOtimizada
            key={img.id}
            img={img}
            onLoad={onImageLoad}
            onRecusar={onRecusar}
          />
        ))}
      </div>
    </div>
  );
}

/* IMAGEM OTIMIZADA */
function ImagemOtimizada({ img, onLoad, onRecusar }) {
  const [carregada, setCarregada] = useState(false);
  const [erro, setErro] = useState(false);

  return (
    <div
      className={`relative w-full h-40 rounded-lg overflow-hidden border border-gray-300
        ${carregada ? "" : "bg-gray-200 animate-pulse"}`}
    >
      {/* BOTÃO DE RECUSAR */}
     <button
        onClick={() => onRecusar(img.id)}
        className="absolute top-2 right-2 z-10 bg-red-600 text-white text-xs px-2 py-1 rounded hover:bg-red-700 transition cursor-pointer"
      >
        X
      </button>


      {/* LOADING */}
      {!carregada && !erro && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-xs">
          Carregando...
        </div>
      )}

      {erro ? (
        <div className="flex items-center justify-center h-full text-gray-700 text-sm">
          Erro ao carregar
        </div>
      ) : (
        <img
          src={img.link_imagem}
          alt={img.codigo_produto}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            carregada ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => {
            setCarregada(true);
            onLoad(img.id);
          }}
          onError={() => setErro(true)}
        />
      )}
    </div>
  );
}
