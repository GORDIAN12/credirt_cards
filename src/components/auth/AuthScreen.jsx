import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("login");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const isLogin = mode === "login";

  async function submit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        if (password.length < 6) {
          throw new Error("La contraseña debe tener al menos 6 caracteres.");
        }
        const data = await signUp(email, password, nombre);
        if (data.session) {
          setInfo("Cuenta creada. Entrando…");
        } else {
          setInfo("Revisa tu correo para confirmar la cuenta y luego inicia sesión.");
          setMode("login");
        }
      }
    } catch (err) {
      setError(err.message || "No se pudo completar la operación.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-card__brand">
          <div className="brand__mark">$</div>
          <div>
            <div className="brand__name">Control de Tarjetas</div>
            <div className="brand__sub">Tu espacio privado de compras y pagos</div>
          </div>
        </div>

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className={isLogin ? "active" : ""}
            aria-selected={isLogin}
            onClick={() => {
              setMode("login");
              setError("");
              setInfo("");
            }}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            role="tab"
            className={!isLogin ? "active" : ""}
            aria-selected={!isLogin}
            onClick={() => {
              setMode("register");
              setError("");
              setInfo("");
            }}
          >
            Registrarse
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {!isLogin && (
            <div className="field">
              <label htmlFor="auth-nombre">Nombre</label>
              <input
                id="auth-nombre"
                type="text"
                autoComplete="name"
                placeholder="Ej. Ana"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="auth-email">Correo</label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="auth-password">Contraseña</label>
            <input
              id="auth-password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder={isLogin ? "Tu contraseña" : "Mínimo 6 caracteres"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && <p className="auth-msg auth-msg--error">{error}</p>}
          {info && <p className="auth-msg auth-msg--info">{info}</p>}

          <button type="submit" className="btn btn--primary auth-submit" disabled={busy}>
            {busy ? "Espera…" : isLogin ? "Entrar" : "Crear cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}
