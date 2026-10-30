import {
  EllipsisVertical,
  Eye,
  EyeOff,
  LoaderCircle,
  RefreshCw,
  Save,
  Search,
  User,
  Users as UsersIcon,
} from "lucide-react"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Fragment,
  type FormEvent,
} from "react"

import Card from "../../components/ui/Card"
import EmptyState from "../../components/ui/EmptyState"
import Modal from "../../components/ui/Modal"
import { errorMessage } from "../../utils/errorMessage"
import {
  ROLE_LABELS,
  roleLabel,
  type Role,
} from "../../utils/roles"
import {
  getUsers,
  resetUserPassword,
  updateUserRole,
  type AdminUser,
} from "../../services/userService"
import { useAuth } from "../../contexts/AuthContext"

const ROLE_OPTIONS: { value: Extract<Role, "STUDENT" | "STAFF" | "ADMIN">; label: string }[] = [
  { value: "STUDENT", label: "Mahasiswa" },
  { value: "STAFF", label: "Petugas" },
  { value: "ADMIN", label: "Administrator" },
]

const ROLE_TONE: Record<Role, string> = {
  STUDENT: "border-amber-200 bg-amber-50/90 text-amber-700",
  STAFF: "border-blue-200 bg-blue-50/90 text-blue-700",
  ADMIN: "border-indigo-200 bg-indigo-50/90 text-indigo-700",
}

function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={`glass-pill inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${ROLE_TONE[role]}`}
    >
      {roleLabel(role)}
    </span>
  )
}

function Users() {
  const { user } = useAuth()
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<Role | "">("")
  const [savingRole, setSavingRole] = useState<number | null>(null)

  // Menu aksi per baris (satu tombol ⋯, dibuka saat ditekan).
  const [actionMenuId, setActionMenuId] = useState<number | null>(null)
  const actionMenuRef = useRef<HTMLDivElement>(null)

  // Modal gabungan untuk "Ubah role" dan "Ganti password".
  const [modalMode, setModalMode] = useState<"role" | "password" | null>(null)
  const [modalTarget, setModalTarget] = useState<AdminUser | null>(null)
  const [modalDraftRole, setModalDraftRole] = useState<string>("")
  const [modalPassword, setModalPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [modalResetting, setModalResetting] = useState(false)
  const [modalResetError, setModalResetError] = useState("")

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const envelope = await getUsers()

        if (!active) {
          return
        }

        setUsers(envelope.items)
        setError("")
      } catch {
        if (!active) {
          return
        }

        setUsers([])
        setError("Gagal memuat daftar pengguna. Coba muat ulang halaman.")
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  // Tutup dropdown saat klik di luar atau menekan Escape.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        actionMenuId !== null &&
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      ) {
        setActionMenuId(null)
      }
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActionMenuId(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeydown)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeydown)
    }
  }, [actionMenuId])

  const isLoading = users === null
  const currentUserId = user?.id ?? null
  const isResetting = modalResetting

  const visibleUsers = useMemo(() => {
    const list = users ?? []
    const keyword = search.trim().toLowerCase()

    return list.filter((u) => {
      const matchSearch =
        keyword === "" || u.username.toLowerCase().includes(keyword)
      const matchRole = roleFilter === "" || u.role === roleFilter

      return matchSearch && matchRole
    })
  }, [users, search, roleFilter])

  const isOwnRow = (id: number) => currentUserId !== null && id === currentUserId

  const openRoleModal = (target: AdminUser) => {
    setActionMenuId(null)
    setModalTarget(target)
    setModalDraftRole(target.role)
    setModalMode("role")
  }

  const openPasswordModal = (target: AdminUser) => {
    setActionMenuId(null)
    setModalTarget(target)
    setModalPassword("")
    setShowPassword(false)
    setModalResetError("")
    setModalMode("password")
  }

  const closeModal = () => {
    setModalMode(null)
    setModalTarget(null)
    setModalDraftRole("")
    setModalPassword("")
    setShowPassword(false)
    setModalResetError("")
    setModalResetting(false)
  }

  const handleSaveRole = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!modalTarget) {
        return
      }
      if (savingRole === modalTarget.id) {
        return
      }
      setSavingRole(modalTarget.id)
      setError("")

      try {
        const updated = await updateUserRole(modalTarget.id, {
          role: modalDraftRole as Role,
        })

        setUsers((current) =>
          (current ?? []).map((u) => (u.id === updated.id ? updated : u)),
        )
        setNotice(
          `Peran "${updated.username}" diperbarui menjadi ${ROLE_LABELS[updated.role]}.`,
        )
        closeModal()
      } catch (requestError: unknown) {
        setError(
          errorMessage(
            (requestError as { response?: { data?: unknown } })?.response
              ?.data,
          ) ?? "Gagal mengubah peran. Coba lagi.",
        )
      } finally {
        setSavingRole(null)
      }
    },
    [modalTarget, modalDraftRole, savingRole],
  )

  const handleResetPassword = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!modalTarget || modalResetting) {
        return
      }
      setModalResetting(true)
      setModalResetError("")

      try {
        await resetUserPassword(modalTarget.id, { password: modalPassword })

        setNotice(
          `Password "${modalTarget.username}" berhasil diatur ulang. Sampaikan password baru lewat jalur yang aman.`,
        )
        closeModal()
      } catch (requestError: unknown) {
        setModalResetError(
          errorMessage(
            (requestError as { response?: { data?: unknown } })?.response
              ?.data,
          ) ?? "Gagal mengatur ulang password. Coba lagi.",
        )
      } finally {
        setModalResetting(false)
      }
    },
    [modalTarget, modalPassword, modalResetting],
  )

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow mb-2">Administrasi</p>
          <h1 className="page-title">Kelola Pengguna</h1>
          <p className="page-subtitle">
            Lihat semua pengguna, ubah peran, dan atur ulang password.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openPasswordModal(null as unknown as AdminUser)}
          className="btn-secondary w-full sm:w-auto"
          disabled={isResetting}
        >
          <RefreshCw size={18} />
          Atur Ulang Password
        </button>
      </section>

      {error ? (
        <div
          role="alert"
          aria-live="polite"
          className="alert-error flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 text-sm"
        >
          <RefreshCw size={18} className="shrink-0 text-red-600" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            className="btn-secondary ml-auto"
          >
            Tutup
          </button>
        </div>
      ) : null}

      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="alert-success flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
        >
          <Save size={18} className="mt-0.5 shrink-0 text-emerald-600" />
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            className="btn-secondary ml-auto"
          >
            Tutup
          </button>
        </div>
      )}

      <div className="glass-panel flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            type="text"
            placeholder="Cari nama pengguna..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Cari pengguna"
            className="input-base py-2.5 pl-10"
          />
        </div>

        <div>
          <label
            htmlFor="user-role-filter"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
          >
            Filter peran
          </label>
          <select
            id="user-role-filter"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as Role | "")}
            disabled={isLoading}
            className="input-base cursor-pointer py-2.5 sm:w-56"
          >
            <option value="">Semua peran</option>
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <p className="px-1 text-xs font-medium tabular-nums text-slate-500 sm:w-40 sm:text-right">
          {isLoading
            ? "Memuat..."
            : `${visibleUsers.length} dari ${users?.length ?? 0} pengguna`}
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
          <LoaderCircle size={30} className="animate-spin" />
          <p>Memuat pengguna...</p>
        </div>
      ) : visibleUsers.length > 0 ? (
        <>
          <div className="rounded-xl bg-white/60 border border-white/70 overflow-hidden">
            <table
              className="min-w-full divide-y divide-slate-900/[0.10]"
              aria-label="Daftar pengguna"
            >
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-[0.12em]"
                  >
                    Pengguna
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-[0.12em] w-[130px]"
                  >
                    Peran
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-[0.12em] w-[170px]"
                  >
                    Bergabung
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-[0.12em] w-[80px] text-right tabular-nums"
                  >
                    Pengaduan
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-[0.12em] w-[150px]"
                  >
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/[0.10]">
              {visibleUsers.map((target) => (
                <Fragment key={target.id}>
                  <tr className="hover:bg-white/70 transition-colors group">
                    <td className="px-5 py-3 sm:px-5">
                      <div className="flex items-center gap-3">
                        <span
                          className="glass-chip h-10 w-10 shrink-0 border-white/70 bg-white/65 text-indigo-600"
                        >
                          <User size={18} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {target.username}
                          </p>
                          {target.id === currentUserId && (
                            <p className="mt-0.5 text-xs text-slate-500">
                              Akun Anda
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3 sm:px-5 w-[130px]">
                      <RoleBadge role={target.role} />
                    </td>

                    <td className="px-5 py-3 sm:px-5 w-[170px] text-slate-700">
                      <time dateTime={target.date_joined}>
                        {new Date(target.date_joined).toLocaleDateString("id-ID", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </time>
                    </td>

                    <td className="px-5 py-3 sm:px-5 w-[80px] text-slate-700 tabular-nums text-right">
                      {target.complaints_count}
                    </td>

                    <td className="px-5 py-3 sm:px-5 w-[150px] text-right relative">
                      <button
                        type="button"
                        onClick={() =>
                          setActionMenuId(actionMenuId === target.id ? null : target.id)
                        }
                        aria-expanded={actionMenuId === target.id}
                        aria-label={`Menu aksi untuk ${target.username}`}
                        className="icon-button shrink-0 p-2"
                      >
                        <EllipsisVertical size={16} />
                      </button>

                      {actionMenuId === target.id && (
                        <div
                          ref={actionMenuRef}
                          className="absolute right-0 mt-1 w-56 z-40 rounded-xl border border-white/60 bg-white/90 shadow-lg text-sm"
                        >
                          <button
                            type="button"
                            onClick={() => openRoleModal(target)}
                            className="w-full text-left px-3 py-2 text-slate-700 hover:bg-white/80 hover:text-indigo-600 cursor-pointer"
                          >
                            Ubah role
                          </button>
                          <div className="border-t border-white/60"></div>
                          <button
                            type="button"
                            onClick={() => openPasswordModal(target)}
                            className="w-full text-left px-3 py-2 text-slate-700 hover:bg-white/80 hover:text-indigo-600 cursor-pointer"
                          >
                            Ganti password
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
          </div>

          {/* Tampilan mobile: satu kartu per pengguna dengan satu tombol menu aksi. */}
          <div className="lg:hidden divide-y divide-slate-900/[0.06]">
            {visibleUsers.map((target) => (
              <Card
                key={target.id}
                className="overflow-hidden p-0 hover:bg-white/50 transition"
              >
                <div className="px-5 py-3 sm:px-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {target.username}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {target.role} · Bergabung {new Date(
                        target.date_joined,
                      ).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {target.complaints_count} pengaduan
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <RoleBadge role={target.role} />

                    <button
                      type="button"
                      onClick={() =>
                        setActionMenuId(actionMenuId === target.id ? null : target.id)
                      }
                      aria-expanded={actionMenuId === target.id}
                      aria-label={`Menu aksi untuk ${target.username}`}
                      className="icon-button shrink-0 p-2"
                    >
                      <EllipsisVertical size={16} />
                    </button>

                    {actionMenuId === target.id && (
                      <div className="absolute right-3 top-14 w-56 z-40 rounded-xl border border-white/60 bg-white/90 shadow-lg text-sm">
                        <button
                          type="button"
                          onClick={() => openRoleModal(target)}
                          className="w-full text-left px-3 py-2 text-slate-700 hover:bg-white/80 hover:text-indigo-600 cursor-pointer"
                        >
                          Ubah role
                        </button>
                        <div className="border-t border-white/60"></div>
                        <button
                          type="button"
                          onClick={() => openPasswordModal(target)}
                          className="w-full text-left px-3 py-2 text-slate-700 hover:bg-white/80 hover:text-indigo-600 cursor-pointer"
                        >
                          Ganti password
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={UsersIcon}
          title={
            users?.length === 0 ? "Belum ada pengguna" : "Pengguna tidak ditemukan"
          }
          description={
            users?.length === 0
              ? "Tidak ada pengguna terdaftar di sistem."
              : "Coba gunakan kata kunci atau filter peran yang berbeda."
          }
          action={
            users?.length === 0 ? null : (
              <button
                type="button"
                onClick={() => {
                  setSearch("")
                  setRoleFilter("")
                }}
                className="btn-secondary"
              >
                Reset filter
              </button>
            )
          }
        />
      )}

      {/* Modal ubah role */}
      {modalMode === "role" && modalTarget && (
        <Modal
          open={true}
          onClose={closeModal}
          title={`Ubah role - ${modalTarget.username}`}
          footer={
            <>
              <button
                type="button"
                onClick={closeModal}
                disabled={savingRole === modalTarget.id}
                className="btn-secondary w-full sm:w-auto"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingRole === modalTarget.id}
                className="btn-primary w-full sm:w-auto"
                form="modal-role-form"
              >
                {savingRole === modalTarget.id ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Simpan
                  </>
                )}
              </button>
            </>
          }
        >
          <form id="modal-role-form" onSubmit={handleSaveRole} className="space-y-3">
            <div>
              <label
                htmlFor="modal-role-user"
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                Pengguna
              </label>
              <p id="modal-role-user" className="text-sm font-semibold text-slate-800 truncate">
                {modalTarget.username}
              </p>
            </div>

            <div>
              <label
                htmlFor="modal-role-current"
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                Role saat ini
              </label>
              <p id="modal-role-current" className="text-sm font-semibold text-slate-800">
                {roleLabel(modalTarget.role)}
              </p>
            </div>

            <div>
              <label
                htmlFor="modal-role-select"
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                Role baru
              </label>
              <select
                id="modal-role-select"
                value={modalDraftRole}
                onChange={(event) => setModalDraftRole(event.target.value as Role)}
                disabled={
                  savingRole === modalTarget.id || isOwnRow(modalTarget.id)
                }
                className="input-base cursor-pointer"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={isOwnRow(modalTarget.id)}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
              {isOwnRow(modalTarget.id) && (
                <p className="mt-1 text-xs text-slate-500">
                  Tidak dapat mengubah role akun Anda sendiri.
                </p>
              )}
            </div>
          </form>
        </Modal>
      )}

      {/* Modal ganti password */}
      {modalMode === "password" && modalTarget && (
        <Modal
          open={true}
          onClose={closeModal}
          title={`Ganti password - ${modalTarget.username}`}
          footer={
            <>
              <button
                type="button"
                onClick={closeModal}
                disabled={modalResetting}
                className="btn-secondary w-full sm:w-auto"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={modalResetting}
                className="btn-primary w-full sm:w-auto"
                form="modal-password-form"
              >
                {modalResetting ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Mengatur ulang...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Atur Ulang Password
                  </>
                )}
              </button>
            </>
          }
        >
          <form id="modal-password-form" onSubmit={handleResetPassword} className="space-y-3">
            <div>
              <label
                htmlFor="modal-password-user"
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                Pengguna
              </label>
              <p id="modal-password-user" className="text-sm font-semibold text-slate-800 truncate">
                {modalTarget.username}
              </p>
            </div>

            <div className="relative">
              <label
                htmlFor="modal-password-input"
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                Password baru
              </label>
              <input
                id="modal-password-input"
                type={showPassword ? "text" : "password"}
                value={modalPassword}
                onChange={(event) => setModalPassword(event.target.value)}
                disabled={modalResetting}
                minLength={8}
                required
                autoComplete="new-password"
                aria-label="Password baru"
                className="input-base pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={modalResetting}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 icon-button shrink-0 p-1"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Minimal 8 karakter. Password baru akan dikirimkan ke pengguna melalui jalaman yang aman.
            </p>

            {modalResetError && (
              <div
                role="alert"
                aria-live="polite"
                className="alert-error flex items-start gap-3 rounded-xl px-4 py-3 text-sm mt-3"
              >
                <RefreshCw size={17} className="mt-0.5 shrink-0 text-red-600" />
                <span>{modalResetError}</span>
              </div>
            )}
          </form>
        </Modal>
      )}
    </div>
  )
}

export default Users
