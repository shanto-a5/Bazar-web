"use client";

import Link from "next/link";
import { useArea } from "@/components/area-provider";
import { useLanguage } from "@/components/language-provider";

export default function SettingsPage() {
  const { area, openSelector } = useArea();
  const { language, setLanguage, t } = useLanguage();

  return (
    <section className="container-page max-w-2xl py-10">
      <h1 className="text-2xl font-bold text-ink">{t("shoppingSettingsTitle")}</h1>

      {/* STEP 2: Bangla / English Switcher */}
      <div className="mt-5 rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-semibold text-ink">{t("languageTitle")}</h2>
        <p className="mt-1 text-sm text-ink-muted">{t("languageCaption")}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setLanguage("bn")}
            aria-pressed={language === "bn"}
            className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
              language === "bn"
                ? "border-brand-500 bg-brand-500 text-white shadow-sm"
                : "border-line bg-surface-muted text-ink hover:border-brand-300"
            }`}
          >
            🇧🇩 {t("banglaName")}
          </button>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            aria-pressed={language === "en"}
            className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
              language === "en"
                ? "border-brand-500 bg-brand-500 text-white shadow-sm"
                : "border-line bg-surface-muted text-ink hover:border-brand-300"
            }`}
          >
            🌐 {t("englishName")}
          </button>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-5">
        <div>
          <h2 className="font-semibold text-ink">{t("shoppingAreaTitle")}</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {area ? `${area.name} — ${t("tapToChangeVillage")}` : t("chooseVillage")}
          </p>
        </div>
        <button
          type="button"
          onClick={openSelector}
          className="shrink-0 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          {t("changeAreaBtn")}
        </button>
      </div>
      <Link href="/" className="mt-5 inline-block font-semibold text-brand-600">
        {t("returnToShopping")}
      </Link>
    </section>
  );
}
