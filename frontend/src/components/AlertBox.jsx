export default function AlertBox({ variant = "danger", title, message }) {
  if (!message) return null;
  return (
    <div className={`alert alert-${variant}`} role="alert">
      {title ? <strong className="d-block mb-1">{title}</strong> : null}
      <div>{message}</div>
    </div>
  );
}