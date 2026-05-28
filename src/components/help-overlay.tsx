import { Fragment } from "react";
import * as colors from "../theme/colors.ts";
import { Dialog, DialogRow, FillRow } from "./dialog.tsx";

interface KeyBinding {
  key: string;
  desc: string;
}

interface Section {
  title: string;
  keys: KeyBinding[];
}

const SECTIONS: Section[] = [
  {
    title: "Navigation",
    keys: [
      { key: "↑↓", desc: "Move through items" },
      { key: "←→", desc: "Switch panels" },
      { key: "PgUp/PgDn", desc: "Page up/down" },
      { key: "Home/End", desc: "First/last item" },
    ],
  },
  {
    title: "Selection",
    keys: [
      { key: "Space", desc: "Toggle selection" },
      { key: "a", desc: "Select all" },
      { key: "A", desc: "Clear selection" },
      { key: "i", desc: "Invert selection" },
      { key: "S", desc: "Select safe items" },
    ],
  },
  {
    title: "Actions",
    keys: [
      { key: "Enter", desc: "Delete selected" },
      { key: "Esc", desc: "Cancel / go back" },
    ],
  },
  {
    title: "Tools",
    keys: [
      { key: "s", desc: "Change sort order" },
      { key: "f", desc: "Filter items" },
      { key: "/", desc: "Fuzzy search" },
      { key: "c", desc: "Toggle density" },
      { key: "r", desc: "Rescan system" },
    ],
  },
];

export function HelpOverlay() {
  return (
    <Dialog borderColor={colors.borderFocus}>
      <DialogRow bold color={colors.accent}>
        Help
      </DialogRow>
      {SECTIONS.map((section) => (
        <Fragment key={section.title}>
          <FillRow />
          <DialogRow bold color={colors.textMuted}>
            {section.title}
          </DialogRow>
          {section.keys.map(({ key, desc }) => (
            <DialogRow key={key} color={colors.text}>
              {`  ${key.padEnd(10)}${desc}`}
            </DialogRow>
          ))}
        </Fragment>
      ))}
      <FillRow />
      <DialogRow color={colors.textMuted}>
        Esc or Enter to close
      </DialogRow>
    </Dialog>
  );
}

