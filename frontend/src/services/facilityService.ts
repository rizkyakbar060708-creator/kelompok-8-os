import api from "./api";

export interface Facility {
  id: number;
  name: string;
  description: string;
  location: string;
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE";
  created_at: string;
  updated_at: string;
}

// TODO(backend): serializer /facilities/ masih datar. Kalau nanti sudah nested
// atau ada endpoint statistik, pindahkan pemanggilan ke sini.
export const getFacilities = async (): Promise<Facility[]> => {
  const response = await api.get("/facilities/");
  return response.data;
};