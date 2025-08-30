export const getOrigin = () => {
    const origin = (import.meta as any).env.VITE_FRONTEND_URL!;
    if (!origin) {
        throw new Error("VITE_FRONTEND_URL is not set");
    }
    return origin;
}