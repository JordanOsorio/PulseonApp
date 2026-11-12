import LegalPage from "./LegalPage";

export default function Terminos() {
  return (
    <LegalPage titulo="Términos y condiciones">
      <p>
        Al crear una cuenta o usar Pulseon aceptas estos términos. Si no estás
        de acuerdo, no uses el servicio.
      </p>
      <h2>El servicio</h2>
      <p>
        Pulseon ofrece herramientas digitales de entrenamiento, nutrición y
        administración de contenidos. El servicio puede cambiar, pausarse o
        interrumpirse por mantenimiento o fuerza mayor.
      </p>
      <h2>Cuenta</h2>
      <ul>
        <li>Debes entregar información veraz y mantener segura tu contraseña.</li>
        <li>Eres responsable de la actividad realizada con tu cuenta.</li>
        <li>Puedes eliminar tu cuenta desde la sección Cuenta (si aplica).</li>
      </ul>
      <h2>Uso aceptable</h2>
      <p>
        No está permitido abusar de la API, intentar acceder sin autorización,
        cargar contenido ilegal o interferir con la plataforma.
      </p>
      <h2>Contenido</h2>
      <p>
        El contenido informativo (ejercicios, recetas, tipologías) es de
        carácter general y no reemplaza consejo médico profesional.
      </p>
      <h2>Limitación</h2>
      <p>
        En la medida permitida por la ley, Pulseon no responde por daños
        indirectos derivados del uso o imposibilidad de uso del servicio.
      </p>
      <h2>Contacto</h2>
      <p>
        Consultas:{" "}
        <a className="text-brand hover:underline" href="mailto:noreply@pulseon.cl">
          noreply@pulseon.cl
        </a>
        .
      </p>
    </LegalPage>
  );
}
