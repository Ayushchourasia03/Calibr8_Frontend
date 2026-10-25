/**
 * Distributed Auth API Module (/api/auth)
 * Re-exports authApi from components/modals/authApi for clean modularity
 * and feature-level colocation.
 */
import { authApi } from "../../components/modals/authApi";

export { authApi };
export default authApi;
