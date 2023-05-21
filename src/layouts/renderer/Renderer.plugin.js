import React from "react";
import { Route, Routes } from "react-router-dom";

// Layout
const DefaultLayout = React.lazy(() => import('../../layouts/DefaultLayout/DefaultLayout'));

// Pages
const OptionsPage = React.lazy(() => import('../../views/settings/global/GlobalSettings'));

const Poker = React.lazy(() => import('../../views/poker/Poker'));
const SprintPlanner = React.lazy(() => import('../../views/planning/sprint-planner'));

export default function Renderer({ authInfo: { userId } }) {
    const layout = (<DefaultLayout key={userId} />);
    return (<Routes>
        <Route exact path="/options" name="Options Page" element={<OptionsPage />} />

        <Route path="/poker/*" name="Planning Poker" element={<Poker hasExtensionSupport={false} />} />
        <Route path="/:userId/planning/sprint-planner" name="Sprint Planner" element={<SprintPlanner />} />

        <Route path="/:userId/*" name="Home" element={layout} />
    </Routes>);
}