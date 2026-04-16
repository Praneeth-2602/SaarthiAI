type Language = {
  code: string;
  label: string;
};

export function LanguageSelector({
  languages,
  selected,
  onChange
}: {
  languages: Language[];
  selected: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label="Preferred language"
      className="field compact-field"
      onChange={(event) => onChange(event.target.value)}
      value={selected}
    >
      {languages.map((language) => (
        <option key={language.code} value={language.code}>
          {language.label}
        </option>
      ))}
    </select>
  );
}
