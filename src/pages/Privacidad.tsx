import LegalPage from "./LegalPage";

export default function Privacidad() {
  return (
    <LegalPage titulo="Política de privacidad">
      <p>
        Pulseon (“nosotros”) trata datos personales para operar la aplicación de
        entrenamiento y nutrición, gestionar cuentas y mejorar el servicio.
      </p>
      <h2>Datos que tratamos</h2>
      <ul>
        <li>Datos de cuenta: email, nombre y credenciales (contraseña hasheada).</li>
        <li>Datos de perfil opcionales: teléfono, medidas, preferencias.</li>
        <li>Datos de uso: progreso, reservas, consumos y contenido que cargas.</li>
        <li>Datos técnicos: logs de autenticación y errores del servidor.</li>
      </ul>
      <h2>Para qué los usamos</h2>
      <ul>
        <li>Crear y autenticar tu cuenta.</li>
        <li>Entregar funciones de la app y el panel admin.</li>
        <li>Enviar correos operativos (bienvenida, recuperación de contraseña).</li>
        <li>Cumplir obligaciones legales y seguridad.</li>
      </ul>
      <h2>Conservación y seguridad</h2>
      <p>
        Conservamos los datos mientras la cuenta esté activa o el tiempo
        necesario para la finalidad. Usamos medidas técnicas razonables
        (HTTPS, JWT, hashing de contraseñas). Ningún sistema es 100% seguro.
      </p>
      <h2>Tus derechos</h2>
      <p>
        Puedes solicitar acceso, rectificación o eliminación de tu cuenta desde
        la app/web o contactándonos. La eliminación borra el perfil asociado
        según nuestras capacidades técnicas.
      </p>
      <h2>Contacto</h2>
      <p>
        Para consultas de privacidad:{" "}
        <a className="text-brand hover:underline" href="mailto:noreply@pulseon.cl">
          noreply@pulseon.cl
        </a>
        .
      </p>
    </LegalPage>
  );
}
