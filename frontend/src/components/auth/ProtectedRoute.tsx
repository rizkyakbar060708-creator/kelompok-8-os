import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import api from "../../services/api";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../../constant";

interface ProtectedRouteProps {
    children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        auth().catch(() => setIsAuthorized(false));
    }, []);

    const refreshToken = async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);

        if (!refreshToken) {
            setIsAuthorized(false);
            return;
        }

        try {
            const res = await api.post("/api/auth/refresh/", {
                refresh: refreshToken,
            });

            if (res.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                setIsAuthorized(true);
            } else {
                setIsAuthorized(false);
            }
        } catch (error) {
            console.log(error);
            setIsAuthorized(false);
        }
    };

    const auth = async () => {
    const token = localStorage.getItem(ACCESS_TOKEN);

    if (!token) {
        setIsAuthorized(false);
        return;
    }

    try {
        const decoded = jwtDecode(token);
        const tokenExpiration = decoded.exp;

        if (!tokenExpiration) {
            setIsAuthorized(false);
            return;
        }

        const now = Date.now() / 1000;

        if (tokenExpiration < now) {
            await refreshToken();
        } else {
            setIsAuthorized(true);
        }
    } catch (error) {
        console.log(error);
        setIsAuthorized(false);
    }
};

    if (isAuthorized === null) {
        return (
            <div className="app-shell flex min-h-screen flex-col items-center justify-center gap-3">
                <span className="h-9 w-9 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />

                <p className="text-sm text-slate-600">Memuat halaman...</p>
            </div>
        );
    }

    return isAuthorized ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;