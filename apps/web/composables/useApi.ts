import type {
  AuthResponse,
  City,
  Country,
  ImageDocument,
  State,
  Tag,
} from "@conteai/shared";

export interface ImageListResponse {
  images: ImageDocument[];
  total: number;
}

export type GalleryQuery = Record<
  string,
  string | string[] | number | boolean | undefined
>;

export interface LoginCredentials {
  name: string;
  password: string;
}

export const useApi = () => {
  const config = useRuntimeConfig();
  const baseURL = config.public.apiUrl;
  const auth = useAuthStore();

  const authHeaders = (): Record<string, string> =>
    auth.token ? { Authorization: `Bearer ${auth.token}` } : {};

  return {
    listImages: (query: GalleryQuery = {}): Promise<ImageListResponse> =>
      $fetch<ImageListResponse>("/images", { baseURL, query }),

    getCountries: (): Promise<Country[]> =>
      $fetch<Country[]>("/countries", { baseURL }),

    getStates: (): Promise<State[]> => $fetch<State[]>("/states", { baseURL }),

    getCities: (): Promise<City[]> => $fetch<City[]>("/cities", { baseURL }),

    getTags: (): Promise<Tag[]> => $fetch<Tag[]>("/tags", { baseURL }),

    authenticate: (credentials: LoginCredentials): Promise<AuthResponse> =>
      $fetch<AuthResponse>("/authentication", {
        baseURL,
        body: credentials,
        method: "POST",
      }),

    uploadImage: (form: FormData): Promise<ImageDocument> =>
      $fetch<ImageDocument>("/images", {
        baseURL,
        body: form,
        headers: authHeaders(),
        method: "POST",
      }),

    editImage: (
      id: string,
      body: Partial<ImageDocument>,
    ): Promise<ImageDocument> =>
      $fetch<ImageDocument>(`/images/${id}`, {
        baseURL,
        body,
        headers: authHeaders(),
        method: "PATCH",
      }),

    deleteImage: (id: string): Promise<void> =>
      $fetch(`/images/${id}`, {
        baseURL,
        headers: authHeaders(),
        method: "DELETE",
      }),
  };
};
