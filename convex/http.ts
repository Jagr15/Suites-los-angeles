import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

// Esto expone los endpoints de autenticación de Convex Auth
auth.addHttpRoutes(http);

export default http;
