// Role aplikasi adalah satu-satunya sumber kebenaran akses, baik di frontend
// maupun di backend. Backend menyimpannya di `accounts/permissions.py`
// (is_admin / is_manager) dan di enum `User.Role`. Modul ini sengaja dibuat
// sebagai cermin supaya tidak ada perbandingan `role === "ADMIN"` yang ditulis
// ulang di beberapa file: satu ketikanya salah, menu atau tombol bisa muncul
// untuk role yang salah tanpa error kompilasi.
//
// Catatan: memblokir menu di frontend BUKAN otorisasi. Filter di sini hanya
// supaya role tidak melihat tautan ke halaman yang memang bukan halamannya.
// Penolakan sesungguhnya tetap di API (ScopedComplaintMixin, IsAdminOrReadOnly,
// CanDeleteComplaint, ComplaintSerializer.validate).

export const ROLES = ["STUDENT", "STAFF", "ADMIN"] as const;

export type Role = (typeof ROLES)[number];

export const STUDENT: Role = "STUDENT";
export const STAFF: Role = "STAFF";
export const ADMIN: Role = "ADMIN";

// Label Bahasa Indonesia untuk ditampilkan di UI, bukan nilai enum yang dikirim
// ke backend. Dipakai supaya kolom "peran" tidak pernah menampilkan string
// mentah yang tidak Reviews.
export const ROLE_LABELS: Record<Role, string> = {
  STUDENT: "Mahasiswa",
  STAFF: "Petugas",
  ADMIN: "Administrator",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

// /auth/me/ mengirim role sebagai string biasa. Nilai di luar tiga role di atas
// diperlakukan sebagai STUDENT, yaitu hak paling rendah, supaya role yang tidak
// dikenali tidak pernah mendapat akses lebih besar karena typo atau data rusak.
export function parseRole(value: unknown): Role {
  return isRole(value) ? value : STUDENT;
}

export function roleLabel(value: unknown): string {
  return ROLE_LABELS[parseRole(value)];
}

// Cermin `is_admin()` di backend: hanya role ADMIN. `is_superuser` sengaja
// tidak ikut dihitung, sama seperti di accounts/permissions.py.
export function isAdmin(role: Role | null | undefined): boolean {
  return role === ADMIN;
}

// Cermin `is_manager()` di backend: staf dan admin. Inilah yang membuat
// ScopedComplaintMixin mengembalikan queryset tanpa filter, jadi staf memang
// melihat seluruh pengaduan, bukan hanya miliknya.
export function isManager(role: Role | null | undefined): boolean {
  return role === STAFF || role === ADMIN;
}