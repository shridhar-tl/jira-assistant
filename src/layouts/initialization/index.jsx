import { registerDepnServices } from "../../services";

export default function withInitParams(App) {
    registerDepnServices();

    // No need of doing any other initialization and hence just return same component
    return App;
}