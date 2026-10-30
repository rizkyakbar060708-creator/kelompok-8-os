interface SpinnerProps {
  size?: number;
  className?: string;
}

// Empat halaman menulis spinner inline dengan ukuran berbeda (16/19/21/26/30).
// Ekstrak ke sini supaya satu gaya dipakai semua tempat; ukuran dan warna tetap
// boleh lewat className penanggil.
function Spinner({ size = 20, className = "" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Memuat"
      className={`inline-block shrink-0 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export default Spinner;