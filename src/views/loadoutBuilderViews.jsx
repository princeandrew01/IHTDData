import { LoadoutBuilderPage } from "../components/loadout-builder/LoadoutBuilderPage";
import { StatsLoadoutPage } from "../components/loadout-builder/StatsLoadoutPage";
import { CoordFinderPage } from "../components/coord-finder/CoordFinderPage";

export function LoadoutBuilderView(props) {
  return <LoadoutBuilderPage {...props} />;
}

export function StatsLoadoutView(props) {
  return <StatsLoadoutPage {...props} />;
}

export function CoordFinderView(props) {
  return <CoordFinderPage {...props} />;
}