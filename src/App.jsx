import { useEffect, useMemo, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function parseJwt(token) {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

export default function App() {
  const {
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
  } = useAuth0();

  const [token, setToken] = useState("");
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    name_instructor: "",
    status: "DISPONIVEL",
  });

  const role = useMemo(() => {
    if (!token) return "USER";
    const claims = parseJwt(token);
    const roles = claims["https://social-insper.com/roles"] || [];
    return roles.includes("ADMIN") ? "ADMIN" : "USER";
  }, [token]);

  useEffect(() => {
    async function loadToken() {
      if (!isAuthenticated) return;

      try {
        const accessToken = await getAccessTokenSilently();
        setToken(accessToken);
      } catch (err) {
        setError(err.message || "Erro ao obter token");
      }
    }

    loadToken();
  }, [isAuthenticated, getAccessTokenSilently]);

  useEffect(() => {
    async function loadCourses() {
      if (!token) return;

      try {
        setError("");
        const res = await fetch(`${API_BASE}/api/courses`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Erro ao listar cursos: ${res.status}`);
        }

        const data = await res.json();
        setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Erro ao carregar cursos");
      }
    }

    loadCourses();
  }, [token]);

  async function refreshCourses() {
    const res = await fetch(`${API_BASE}/api/courses`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Erro ao atualizar cursos: ${res.status}`);
    }

    const data = await res.json();
    setCourses(Array.isArray(data) ? data : []);
  }

  async function handleCreateCourse(e) {
    e.preventDefault();
    if (role !== "ADMIN") return;

    try {
      setSaving(true);
      setError("");

      const res = await fetch(`${API_BASE}/api/courses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          name_instructor: form.name_instructor,
          status: form.status,
        }),
      });

      if (!res.ok) {
        throw new Error(`Erro ao cadastrar curso: ${res.status}`);
      }

      setForm({
        name: "",
        email: "",
        name_instructor: "",
        status: "DISPONIVEL",
      });

      await refreshCourses();
    } catch (err) {
      setError(err.message || "Erro ao cadastrar curso");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCourse(courseId) {
    if (role !== "ADMIN") return;

    const confirmed = window.confirm("Deseja excluir este curso?");
    if (!confirmed) return;

    try {
      setError("");
      const res = await fetch(`${API_BASE}/api/courses/${courseId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status !== 204) {
        throw new Error(`Erro ao excluir curso: ${res.status}`);
      }

      setCourses((prev) => prev.filter((course) => course.id !== courseId));
    } catch (err) {
      setError(err.message || "Erro ao excluir curso");
    }
  }

  if (isLoading) {
    return <div className="page">Carregando...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="page center">
        <button className="btn primary" onClick={() => loginWithRedirect()}>
          Entrar com Auth0
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <header className="card header">
          <div>
            <h1 className="title">Cursos</h1>
            <p className="subtitle">Perfil: {role}</p>
          </div>

          <button
            className="btn"
            onClick={() =>
              logout({ logoutParams: { returnTo: window.location.origin } })
            }
          >
            Sair
          </button>
        </header>

        {error && <div className="card error">{error}</div>}

        {role === "ADMIN" && (
          <form onSubmit={handleCreateCourse} className="card form-grid">
            <input
              className="input"
              placeholder="Nome do curso"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            <input
              className="input"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />

            <input
              className="input"
              placeholder="Nome do instrutor"
              value={form.name_instructor}
              onChange={(e) =>
                setForm({ ...form, name_instructor: e.target.value })
              }
              required
            />

            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="DISPONIVEL">DISPONIVEL</option>
              <option value="CANCELADO">CANCELADO</option>
            </select>

            <button className="btn primary" type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Cadastrar curso"}
            </button>
          </form>
        )}

        <section className="grid">
          {courses.length === 0 ? (
            <div className="card">Nenhum curso cadastrado.</div>
          ) : (
            courses.map((course) => (
              <article
                key={course.id}
                className="card course-item"
              >
                <div>
                  <h2 className="course-name">{course.name}</h2>
                  <p className="course-meta">Email: {course.email}</p>
                  <p className="course-meta">
                    Instrutor: {course.name_instructor}
                  </p>
                  <p className="course-meta">Código: {course.code_course}</p>
                  <p className="course-meta">Status: {course.status}</p>
                  <p className="course-meta">
                    Cadastro:{" "}
                    {course.created_at
                      ? new Date(course.created_at).toLocaleString("pt-BR")
                      : "-"}
                  </p>
                </div>

                {role === "ADMIN" && (
                  <button
                    className="btn danger"
                    onClick={() => handleDeleteCourse(course.id)}
                  >
                    Excluir
                  </button>
                )}
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}