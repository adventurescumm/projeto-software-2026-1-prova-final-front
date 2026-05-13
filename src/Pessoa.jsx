import { useAuth0 } from "@auth0/auth0-react";
import React, { useEffect, useState } from "react";
import LoginButton from "./LoginButton";
import LogoutButton from "./LogoutButton";

const BASE_URL_USERS = "/api"
const BASE_URL_CONNECTIONS = "/api";


export default function PessoasApp() {
  const [pessoas, setPessoas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState("")

  const {
    user,
    isAuthenticated,
    getAccessTokenSilently
  } = useAuth0();

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const accessToken = await getAccessTokenSilently();
        console.log(accessToken)
        setToken(accessToken);
      } catch (e) {
        console.error('Erro ao buscar token:', e);
      }
    };

    if (isAuthenticated) {
      fetchToken();
    }
  }, [isAuthenticated, getAccessTokenSilently]);


  if (!isAuthenticated) {
    return <LoginButton />;
  }

  async function fetchConnections() {
    setLoading(true);
    setError(null);

    try {
      // 1. Busca o usuário pelo email
      const userRes = await fetch(`${BASE_URL_USERS}/users/${user.email}/email`);
      
      if (!userRes.ok) {
        throw new Error(`Erro ao buscar usuário: ${userRes.status}`);
      }

      const userData = await userRes.json();
      const userId = userData.id;

      // 2. Busca as connections usando o id
      const connRes = await fetch(`${BASE_URL_CONNECTIONS}/connections/${userId}`, {
        headers: {
          // Authorization: `Bearer ${token}`,
        },
      });

      if (!connRes.ok) {
        throw new Error(`Erro ao carregar conexões: ${connRes.status}`);
      }

      const connData = await connRes.json();
      setPessoas(Array.isArray(connData) ? connData : []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50 font-sans">

      <div>
        <img src={user.picture} alt={user.name} />
        <h2>{user.name}</h2>
        <p>{user.email}</p>
        <LogoutButton />
      </div>


      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Conexões</h1>

        {error && <div className="mb-4 text-red-600">{error}</div>}

        <div>
          <h2 className="text-xl font-semibold mb-2">Lista de Conexões</h2>

          <button onClick={fetchConnections}>
            Carregar
          </button>
          {loading ? (
            <div>Carregando...</div>
          ) : pessoas.length === 0 ? (
            <div>Nenhuma conexão encontrada.</div>
          ) : (
            <ul className="space-y-3">
              {pessoas.map((s) => (
                <li key={s.id} className="p-3 border rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{s.fromUserId}</div>
                      {s.email && <div className="text-sm text-gray-600">{s.email}</div>}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{s.toUserId ?? "-"}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

    </div>
  );
}