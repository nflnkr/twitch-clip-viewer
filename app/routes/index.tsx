import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
    component: Home,
});

function Home() {
    return <h3 className="m-2 font-bold">Hello world</h3>;
}
