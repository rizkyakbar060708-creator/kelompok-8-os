import {
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
  useState,
  type FormEvent,
} from "react"

import Card from "../../components/ui/Card"
import EmptyState from "../../components/ui/EmptyState"
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

function Users() {
  const { user } = useAuth()
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<Role | "">("")
  const [savingRole, setSavingRole] = useState<number | null>(null)
  const [draftRoles, setDraftRoles] = useState<Record<number, string>>({})
  const [resetting, setResetting] = useState<number | null>(null)
  const [resetOpenId, setResetOpenId] = useState<number | null>(null)
  const [resetPassword, setResetPassword] = useState("")
  const [resetError, setResetError] = useState("")

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

  const isLoading = users === null
  const currentUserId = user?.id ?? null

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

  const handleSaveRole = useCallback(
    async (event: FormEvent<HTMLFormElement>, target: AdminUser) => {
      event.preventDefault()

      if (savingRole === target.id) {
        return
      }

      setSavingRole(target.id)
      setError("")

      try {
        const role = (draftRoles[target.id] ?? target.role) as
          | "STUDENT"
          | "STAFF"
          | "ADMIN"

        const updated = await updateUserRole(target.id, { role })

        setUsers((current) =>
          (current ?? []).map((u) => (u.id === updated.id ? updated : u)),
        )
        setDraftRoles((d) => {
          const next = { ...d }
          delete next[target.id]

          return next
        })
        setNotice(
          `Peran "${updated.username}" diperbarui menjadi ${ROLE_LABELS[updated.role]}.`,
        )
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
    [savingRole, draftRoles],
  )

  const handleResetPassword = useCallback(
    async (event: FormEvent<HTMLFormElement>, target: AdminUser) => {
      event.preventDefault()

      if (resetting === target.id) {
        return
      }

      setResetting(target.id)
      setResetError("")

      try {
        await resetUserPassword(target.id, { password: resetPassword })

        setNotice(
          `Password "${target.username}" berhasil diatur ulang. Sampaikan password baru lewat jalur yang aman.`,
        )
        setResetPassword("")
        setResetError("")
        setResetOpenId(null)
      } catch (requestError: unknown) {
        setResetError(
          errorMessage(
            (requestError as { response?: { data?: unknown } })?.response
              ?.data,
          ) ?? "Gagal mengatur ulang password. Coba lagi.",
        )
      } finally {
        setResetting(null)
      }
    },
    [resetting, resetPassword],
  )

  const openReset = (id: number | null) => {
    setResetOpenId(id)
    setResetError("")
    if (id === null) {
      setResetPassword("")
    }
  }

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
          onClick={() => openReset(null)}
          className="btn-secondary w-full sm:w-auto"
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
          <table
            className="hidden lg:block w-full text-sm divide-y divide-slate-900/[0.07]"
            aria-label="Daftar pengguna"
          >
            <thead className="bg-slate-900/[0.03]">
              <tr>
                <th
                  scope="col"
                  className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-[0.12em]"
                >
                  Pengguna
                </th>
                <th
                  scope="col"
                  className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-[0.12em]"
                >
                  Peran
                </th>
                <th
                  scope="col"
                  className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-[0.12em]"
                >
                  Bergabung
                </th>
                <th
                  scope="col"
                  className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-[0.12em]"
                >
                  Pengaduan
                </th>
                <th
                  scope="col"
                  className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-[0.12em]"
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/[0.07]">
              {visibleUsers.map((target) => (
                <tr
                  key={target.id}
                  className="transition hover:bg-white/70 group"
                >
                  <td className="px-5 py-4 sm:px-6">
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

                  <td className="px-5 py-4 sm:px-6">
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        target.role === "ADMIN"
                          ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                          : target.role === "STAFF"
                          ? "bg-blue-100 text-blue-700 border border-blue-200"
                          : "bg-amber-100 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {roleLabel(target.role)}
                    </span>
                  </td>

                  <td className="px-5 py-4 sm:px-6 text-slate-600">
                    <time dateTime={target.date_joined}>
                      {new Date(target.date_joined).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  </td>

                  <td className="px-5 py-4 sm:px-6 text-slate-600 tabular-nums">
                    {target.complaints_count}
                  </td>

                  <td className="px-5 py-4 sm:px-6 text-right">
                    <form
                      onSubmit={(event) => {
                        event.preventDefault()
                        handleSaveRole(event, target)
                      }}
                      className="flex items-center gap-2"
                    >
                      <label
                        htmlFor={`user-role-select-${target.id}`}
                        className="sr-only"
                      >
                        Peran untuk {target.username}
                      </label>
                      <select
                        id={`user-role-select-${target.id}`}
                        value={draftRoles[target.id] ?? target.role}
                        onChange={(event) =>
                          setDraftRoles((d) => ({
                            ...d,
                            [target.id]: event.target.value,
                          }))
                        }
                        disabled={
                          savingRole === target.id || isOwnRow(target.id)
                        }
                        className="input-base cursor-pointer sm:w-40"
                      >
                        {ROLE_OPTIONS.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                            disabled={isOwnRow(target.id)}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <button
                        type="submit"
                        disabled={
                          savingRole === target.id || isOwnRow(target.id)
                        }
                        className="btn-secondary shrink-0 py-2"
                      >
                        {savingRole === target.id ? (
                          <LoaderCircle size={15} className="animate-spin" />
                        ) : (
                          <Save size={15} />
                        )}
                        {savingRole === target.id ? "Menyimpan..." : "Simpan"}
                      </button>

                      {isOwnRow(target.id) && (
                        <span
                          className="ml-2 text-xs text-slate-500 whitespace-nowrap"
                          title="Tidak dapat mengubah peran akun Anda sendiri"
                        >
                          Tidak dapat mengubah peran sendiri
                        </span>
                      )}
                    </form>

                    <button
                      type="button"
                      onClick={() => openReset(target.id)}
                      disabled={resetting === target.id || isOwnRow(target.id)}
                      className="mt-2 btn-secondary shrink-0 py-2 text-xs"
                      title={
                        isOwnRow(target.id)
                          ? "Tidak dapat mengatur ulang password akun Anda sendiri"
                          : "Atur ulang password pengguna ini"
                      }
                    >
                      {resetting === target.id ? (
                        <LoaderCircle size={14} className="animate-spin" />
                      ) : (
                        <RefreshCw size={14} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="lg:hidden divide-y divide-slate-900/[0.07]">
            {visibleUsers.map((target) => (
              <Card
                key={target.id}
                className="overflow-hidden p-0"
              >
                <div className="px-5 py-4 sm:px-6">
                  <div className="flex flex-wrap items-center gap-4">
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
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          target.role === "ADMIN"
                            ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                            : target.role === "STAFF"
                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                            : "bg-amber-100 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {roleLabel(target.role)}
                      </span>

                      <form
                        onSubmit={(event) => {
                          event.preventDefault()
                          handleSaveRole(event, target)
                        }}
                        className="flex items-center gap-2"
                      >
                        <label
                          htmlFor={`mobile-role-select-${target.id}`}
                          className="sr-only"
                        >
                          Peran untuk {target.username}
                        </label>
                        <select
                          id={`mobile-role-select-${target.id}`}
                          value={draftRoles[target.id] ?? target.role}
                          onChange={(event) =>
                            setDraftRoles((d) => ({
                              ...d,
                              [target.id]: event.target.value,
                            }))
                          }
                          disabled={
                            savingRole === target.id || isOwnRow(target.id)
                          }
                          className="input-base cursor-pointer sm:w-40"
                        >
                          {ROLE_OPTIONS.map((option) => (
                            <option
                              key={option.value}
                              value={option.value}
                              disabled={isOwnRow(target.id)}
                            >
                              {option.label}
                            </option>
                          ))}
                        </select>

                        <button
                          type="submit"
                          disabled={
                            savingRole === target.id || isOwnRow(target.id)
                          }
                          className="btn-secondary shrink-0 py-2 text-xs"
                        >
                          {savingRole === target.id ? (
                            <LoaderCircle size={14} className="animate-spin" />
                          ) : (
                            <Save size={14} />
                          )}
                          {savingRole === target.id ? "Menyimpan..." : "Simpan"}
                        </button>

                        {isOwnRow(target.id) && (
                          <span
                            className="ml-1 text-[10px] text-slate-500 whitespace-nowrap"
                            title="Tidak dapat mengubah peran akun Anda sendiri"
                          >
                            sendiri
                          </span>
                        )}
                      </form>

                      <button
                        type="button"
                        onClick={() => openReset(target.id)}
                        disabled={resetting === target.id || isOwnRow(target.id)}
                        className="mt-1.5 btn-secondary shrink-0 py-2 text-xs"
                        title={
                          isOwnRow(target.id)
                            ? "Tidak dapat mengatur ulang password akun Anda sendiri"
                            : "Atur ulang password pengguna ini"
                        }
                      >
                        {resetting === target.id ? (
                          <LoaderCircle size={13} className="animate-spin" />
                        ) : (
                          <RefreshCw size={13} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {resetOpenId === target.id && (
                  <div className="border-t border-slate-900/[0.08] px-5 py-4 sm:px-6">
                    <form
                      onSubmit={(event) =>
                        handleResetPassword(event, target)
                      }
                      className="space-y-3"
                    >
                      <div>
                        <label
                          htmlFor={`reset-password-${target.id}`}
                          className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
                        >
                          Password baru untuk {target.username}
                        </label>
                        <input
                          id={`reset-password-${target.id}`}
                          type="password"
                          value={resetPassword}
                          onChange={(event) =>
                            setResetPassword(event.target.value)
                          }
                          disabled={resetting === target.id}
                          minLength={8}
                          required
                          aria-label="Password baru"
                          className="input-base"
                        />
                      </div>

                      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => openReset(null)}
                          disabled={resetting === target.id}
                          className="btn-secondary w-full sm:w-auto"
                        >
                          Batal
                        </button>

                        <button
                          type="submit"
                          disabled={resetting === target.id}
                          className="btn-primary w-full sm:w-auto"
                        >
                          {resetting === target.id ? (
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
                      </div>

                      {resetError && (
                        <div
                          role="alert"
                          aria-live="polite"
                          className="alert-error flex items-start gap-3 rounded-xl px-4 py-3 text-sm mt-3"
                        >
                          <RefreshCw size={17} className="mt-0.5 shrink-0 text-red-600" />
                          <span>{resetError}</span>
                        </div>
                      )}
                    </form>
                  </div>
                )}
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
    </div>
  )
}

export default Users
