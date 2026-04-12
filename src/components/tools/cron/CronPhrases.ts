import type { Language } from '../../../i18n'
import type { CronFieldType } from '../../../tools/cron-expression'
import { cronExamples, awsCronExamples } from '../../../tools/cron-expression'

export type BuilderMode = 'everyMinutes' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'lastDay' | 'nthWeekday'

export type UnitLabel = { singular: string; plural: string; valuePrefix: string; everyLabel: string }

export type PhraseSet = {
  locale: string
  parse: string
  builder: string
  builderPreview: string
  builderMinute: string
  builderHour: string
  builderStep: string
  builderDayOfWeek: string
  builderDayOfMonth: string
  builderModes: Record<BuilderMode, string>
  examples: string
  explanation: string
  normalized: string
  shortcut: string
  fields: string
  everyMinute: string
  atEveryReboot: string
  atTime: (hour: number, minute: number) => string
  atMinutePastEveryHour: (minute: number) => string
  everyStep: (count: number, unit: string) => string
  fieldAny: (unit: UnitLabel) => string
  fieldValue: (unit: UnitLabel, value: string) => string
  fieldRange: (unit: UnitLabel, start: string, end: string) => string
  fieldStepRange: (count: number, unit: string, start: string, end: string) => string
  fieldStepStart: (count: number, unit: string, start: string) => string
  join: (parts: string[]) => string
  exampleLabels: Record<(typeof cronExamples)[number], string>
  unix: string
  aws: string
  convertTo: (format: string) => string
  fieldUnspecified: string
  fieldLast: string
  fieldLastWeekday: (day: string) => string
  fieldNearestWeekday: (day: string) => string
  fieldNthDay: (day: string, nth: string) => string
  awsExampleLabels: Record<(typeof awsCronExamples)[number], string>
  schedulePreview: string
  referenceTime: string
  occurrenceCount: string
  upcoming: string
  previous: string
  noOccurrences: string
  timeFromNow: (diff: string) => string
  timeAgo: (diff: string) => string
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export const phraseSets: Record<Language, PhraseSet> = {
  en: {
    locale: 'en-US',
    parse: 'Explain cron',
    builder: 'Build cron',
    builderPreview: 'Generated expression',
    builderMinute: 'Minute',
    builderHour: 'Hour',
    builderStep: 'Every',
    builderDayOfWeek: 'Day of week',
    builderDayOfMonth: 'Day of month',
    builderModes: {
      everyMinutes: 'Every N minutes',
      hourly: 'Hourly',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      lastDay: 'Last day of month',
      nthWeekday: 'Nth weekday',
    },
    examples: 'Examples',
    explanation: 'Explanation',
    normalized: 'Normalized expression',
    shortcut: 'Shortcut',
    fields: 'Field breakdown',
    everyMinute: 'Every minute',
    atEveryReboot: 'At every reboot',
    atTime: (hour, minute) => `At ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    atMinutePastEveryHour: (minute) => `At minute ${minute} past every hour`,
    everyStep: (count, unit) => `Every ${count} ${unit}`,
    fieldAny: (unit) => unit.everyLabel,
    fieldValue: (unit, value) => `${unit.valuePrefix} ${value}`,
    fieldRange: (unit, start, end) => `${capitalize(unit.plural)} ${start} through ${end}`,
    fieldStepRange: (count, unit, start, end) => `Every ${count} ${unit} from ${start} through ${end}`,
    fieldStepStart: (count, unit, start) => `Every ${count} ${unit} starting at ${start}`,
    join: (parts) => parts.join(', '),
    exampleLabels: {
      '*/15 * * * *': 'Every 15 minutes',
      '0 * * * *': 'Top of every hour',
      '0 9 * * 1-5': 'Weekdays at 09:00',
      '30 6 1 * *': 'Monthly on day 1 at 06:30',
      '0 0 1 1 *': 'Yearly on January 1',
      '@daily': 'Daily at midnight',
      '@reboot': 'At reboot',
    },
    unix: 'Unix',
    aws: 'AWS',
    convertTo: (format) => `Convert to ${format}`,
    fieldUnspecified: 'no specific value',
    fieldLast: 'last day of the month',
    fieldLastWeekday: (day) => `last ${day} of the month`,
    fieldNearestWeekday: (day) => `nearest weekday to the ${day}`,
    fieldNthDay: (day, nth) => `${nth} ${day} of the month`,
    awsExampleLabels: {
      '0 10 * * ? *': 'Every day at 10:00 UTC',
      '0/15 * ? * MON-FRI *': 'Every 15 min, weekdays',
      '0 8 1 * ? *': '1st of month at 08:00',
      '0 10 L * ? *': 'Last day of month at 10:00',
      '0 10 ? * 6#3 *': '3rd Friday at 10:00',
      '0 10 15W * ? *': 'Nearest weekday to 15th at 10:00',
      '0 0 ? * 3L *': 'Last Tuesday at midnight',
    },
    schedulePreview: 'Schedule preview',
    referenceTime: 'Reference time',
    occurrenceCount: 'Show',
    upcoming: 'Upcoming',
    previous: 'Previous',
    noOccurrences: 'No occurrences found',
    timeFromNow: (diff) => `in ${diff}`,
    timeAgo: (diff) => `${diff} ago`,
  },
  it: {
    locale: 'it-IT',
    parse: 'Spiega cron',
    builder: 'Costruisci cron',
    builderPreview: 'Espressione generata',
    builderMinute: 'Minuto',
    builderHour: 'Ora',
    builderStep: 'Ogni',
    builderDayOfWeek: 'Giorno settimana',
    builderDayOfMonth: 'Giorno del mese',
    builderModes: {
      everyMinutes: 'Ogni N minuti',
      hourly: 'Orario',
      daily: 'Giornaliero',
      weekly: 'Settimanale',
      monthly: 'Mensile',
      lastDay: 'Ultimo giorno del mese',
      nthWeekday: 'N-esimo giorno',
    },
    examples: 'Esempi',
    explanation: 'Spiegazione',
    normalized: 'Espressione normalizzata',
    shortcut: 'Shortcut',
    fields: 'Dettaglio campi',
    everyMinute: 'Ogni minuto',
    atEveryReboot: 'A ogni riavvio',
    atTime: (hour, minute) => `Alle ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    atMinutePastEveryHour: (minute) => `Al minuto ${minute} di ogni ora`,
    everyStep: (count, unit) => `Ogni ${count} ${unit}`,
    fieldAny: (unit) => unit.everyLabel,
    fieldValue: (unit, value) => `${unit.valuePrefix} ${value}`,
    fieldRange: (unit, start, end) => `${capitalize(unit.plural)} da ${start} a ${end}`,
    fieldStepRange: (count, unit, start, end) => `Ogni ${count} ${unit} da ${start} a ${end}`,
    fieldStepStart: (count, unit, start) => `Ogni ${count} ${unit} a partire da ${start}`,
    join: (parts) => parts.join(', '),
    exampleLabels: {
      '*/15 * * * *': 'Ogni 15 minuti',
      '0 * * * *': 'Allo scoccare di ogni ora',
      '0 9 * * 1-5': 'Feriali alle 09:00',
      '30 6 1 * *': 'Mensile il giorno 1 alle 06:30',
      '0 0 1 1 *': 'Annuale il 1 gennaio',
      '@daily': 'Ogni giorno a mezzanotte',
      '@reboot': 'Al riavvio',
    },
    unix: 'Unix',
    aws: 'AWS',
    convertTo: (format) => `Converti in ${format}`,
    fieldUnspecified: 'nessun valore specifico',
    fieldLast: 'ultimo giorno del mese',
    fieldLastWeekday: (day) => `ultimo ${day} del mese`,
    fieldNearestWeekday: (day) => `giorno feriale piu vicino al ${day}`,
    fieldNthDay: (day, nth) => `${nth}\u00b0 ${day} del mese`,
    awsExampleLabels: {
      '0 10 * * ? *': 'Ogni giorno alle 10:00 UTC',
      '0/15 * ? * MON-FRI *': 'Ogni 15 min, feriali',
      '0 8 1 * ? *': '1\u00b0 del mese alle 08:00',
      '0 10 L * ? *': 'Ultimo giorno alle 10:00',
      '0 10 ? * 6#3 *': '3\u00b0 venerdi alle 10:00',
      '0 10 15W * ? *': 'Feriale piu vicino al 15',
      '0 0 ? * 3L *': 'Ultimo martedi a mezzanotte',
    },
    schedulePreview: 'Anteprima programmazione',
    referenceTime: 'Orario di riferimento',
    occurrenceCount: 'Mostra',
    upcoming: 'Prossimi',
    previous: 'Precedenti',
    noOccurrences: 'Nessuna occorrenza trovata',
    timeFromNow: (diff) => `tra ${diff}`,
    timeAgo: (diff) => `${diff} fa`,
  },
  es: {
    locale: 'es-ES',
    parse: 'Explicar cron',
    builder: 'Construir cron',
    builderPreview: 'Expresion generada',
    builderMinute: 'Minuto',
    builderHour: 'Hora',
    builderStep: 'Cada',
    builderDayOfWeek: 'Dia de la semana',
    builderDayOfMonth: 'Dia del mes',
    builderModes: {
      everyMinutes: 'Cada N minutos',
      hourly: 'Cada hora',
      daily: 'Diario',
      weekly: 'Semanal',
      monthly: 'Mensual',
      lastDay: 'Ultimo dia del mes',
      nthWeekday: 'N-esimo dia',
    },
    examples: 'Ejemplos',
    explanation: 'Explicacion',
    normalized: 'Expresion normalizada',
    shortcut: 'Atajo',
    fields: 'Detalle de campos',
    everyMinute: 'Cada minuto',
    atEveryReboot: 'En cada reinicio',
    atTime: (hour, minute) => `A las ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    atMinutePastEveryHour: (minute) => `En el minuto ${minute} de cada hora`,
    everyStep: (count, unit) => `Cada ${count} ${unit}`,
    fieldAny: (unit) => unit.everyLabel,
    fieldValue: (unit, value) => `${unit.valuePrefix} ${value}`,
    fieldRange: (unit, start, end) => `${capitalize(unit.plural)} de ${start} a ${end}`,
    fieldStepRange: (count, unit, start, end) => `Cada ${count} ${unit} de ${start} a ${end}`,
    fieldStepStart: (count, unit, start) => `Cada ${count} ${unit} desde ${start}`,
    join: (parts) => parts.join(', '),
    exampleLabels: {
      '*/15 * * * *': 'Cada 15 minutos',
      '0 * * * *': 'Al inicio de cada hora',
      '0 9 * * 1-5': 'Entre semana a las 09:00',
      '30 6 1 * *': 'Mensual el dia 1 a las 06:30',
      '0 0 1 1 *': 'Anual el 1 de enero',
      '@daily': 'Diario a medianoche',
      '@reboot': 'Al reiniciar',
    },
    unix: 'Unix',
    aws: 'AWS',
    convertTo: (format) => `Convertir a ${format}`,
    fieldUnspecified: 'sin valor especifico',
    fieldLast: 'ultimo dia del mes',
    fieldLastWeekday: (day) => `ultimo ${day} del mes`,
    fieldNearestWeekday: (day) => `dia laborable mas cercano al ${day}`,
    fieldNthDay: (day, nth) => `${nth}\u00b0 ${day} del mes`,
    awsExampleLabels: {
      '0 10 * * ? *': 'Cada dia a las 10:00 UTC',
      '0/15 * ? * MON-FRI *': 'Cada 15 min, laborables',
      '0 8 1 * ? *': '1\u00b0 del mes a las 08:00',
      '0 10 L * ? *': 'Ultimo dia del mes a las 10:00',
      '0 10 ? * 6#3 *': '3\u00b0 viernes a las 10:00',
      '0 10 15W * ? *': 'Dia laborable mas cercano al 15',
      '0 0 ? * 3L *': 'Ultimo martes a medianoche',
    },
    schedulePreview: 'Vista previa del horario',
    referenceTime: 'Hora de referencia',
    occurrenceCount: 'Mostrar',
    upcoming: 'Proximos',
    previous: 'Anteriores',
    noOccurrences: 'No se encontraron ocurrencias',
    timeFromNow: (diff) => `en ${diff}`,
    timeAgo: (diff) => `hace ${diff}`,
  },
  fr: {
    locale: 'fr-FR',
    parse: 'Expliquer cron',
    builder: 'Construire cron',
    builderPreview: 'Expression generee',
    builderMinute: 'Minute',
    builderHour: 'Heure',
    builderStep: 'Toutes les',
    builderDayOfWeek: 'Jour de semaine',
    builderDayOfMonth: 'Jour du mois',
    builderModes: {
      everyMinutes: 'Toutes les N minutes',
      hourly: 'Horaire',
      daily: 'Quotidien',
      weekly: 'Hebdomadaire',
      monthly: 'Mensuel',
      lastDay: 'Dernier jour du mois',
      nthWeekday: 'N-ieme jour',
    },
    examples: 'Exemples',
    explanation: 'Explication',
    normalized: 'Expression normalisee',
    shortcut: 'Raccourci',
    fields: 'Detail des champs',
    everyMinute: 'Chaque minute',
    atEveryReboot: 'A chaque redemarrage',
    atTime: (hour, minute) => `A ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    atMinutePastEveryHour: (minute) => `A la minute ${minute} de chaque heure`,
    everyStep: (count, unit) => `Toutes les ${count} ${unit}`,
    fieldAny: (unit) => unit.everyLabel,
    fieldValue: (unit, value) => `${unit.valuePrefix} ${value}`,
    fieldRange: (unit, start, end) => `${capitalize(unit.plural)} de ${start} a ${end}`,
    fieldStepRange: (count, unit, start, end) => `Toutes les ${count} ${unit} de ${start} a ${end}`,
    fieldStepStart: (count, unit, start) => `Toutes les ${count} ${unit} a partir de ${start}`,
    join: (parts) => parts.join(', '),
    exampleLabels: {
      '*/15 * * * *': 'Toutes les 15 minutes',
      '0 * * * *': 'Au debut de chaque heure',
      '0 9 * * 1-5': 'En semaine a 09:00',
      '30 6 1 * *': 'Mensuel le jour 1 a 06:30',
      '0 0 1 1 *': 'Annuel le 1 janvier',
      '@daily': 'Chaque jour a minuit',
      '@reboot': 'Au redemarrage',
    },
    unix: 'Unix',
    aws: 'AWS',
    convertTo: (format) => `Convertir en ${format}`,
    fieldUnspecified: 'aucune valeur specifique',
    fieldLast: 'dernier jour du mois',
    fieldLastWeekday: (day) => `dernier ${day} du mois`,
    fieldNearestWeekday: (day) => `jour ouvrable le plus proche du ${day}`,
    fieldNthDay: (day, nth) => `${nth}e ${day} du mois`,
    awsExampleLabels: {
      '0 10 * * ? *': 'Chaque jour a 10:00 UTC',
      '0/15 * ? * MON-FRI *': 'Toutes les 15 min, semaine',
      '0 8 1 * ? *': '1er du mois a 08:00',
      '0 10 L * ? *': 'Dernier jour du mois a 10:00',
      '0 10 ? * 6#3 *': '3e vendredi a 10:00',
      '0 10 15W * ? *': 'Jour ouvrable le plus proche du 15',
      '0 0 ? * 3L *': 'Dernier mardi a minuit',
    },
    schedulePreview: 'Apercu du planning',
    referenceTime: 'Heure de reference',
    occurrenceCount: 'Afficher',
    upcoming: 'A venir',
    previous: 'Precedents',
    noOccurrences: 'Aucune occurrence trouvee',
    timeFromNow: (diff) => `dans ${diff}`,
    timeAgo: (diff) => `il y a ${diff}`,
  },
  de: {
    locale: 'de-DE',
    parse: 'Cron erklaren',
    builder: 'Cron bauen',
    builderPreview: 'Erzeugter Ausdruck',
    builderMinute: 'Minute',
    builderHour: 'Stunde',
    builderStep: 'Alle',
    builderDayOfWeek: 'Wochentag',
    builderDayOfMonth: 'Tag des Monats',
    builderModes: {
      everyMinutes: 'Alle N Minuten',
      hourly: 'Stundlich',
      daily: 'Taglich',
      weekly: 'Wochentlich',
      monthly: 'Monatlich',
      lastDay: 'Letzter Tag des Monats',
      nthWeekday: 'N-ter Wochentag',
    },
    examples: 'Beispiele',
    explanation: 'Erklarung',
    normalized: 'Normalisierter Ausdruck',
    shortcut: 'Kurzform',
    fields: 'Feldaufschlusselung',
    everyMinute: 'Jede Minute',
    atEveryReboot: 'Bei jedem Neustart',
    atTime: (hour, minute) => `Um ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    atMinutePastEveryHour: (minute) => `In Minute ${minute} jeder Stunde`,
    everyStep: (count, unit) => `Alle ${count} ${unit}`,
    fieldAny: (unit) => unit.everyLabel,
    fieldValue: (unit, value) => `${unit.valuePrefix} ${value}`,
    fieldRange: (unit, start, end) => `${capitalize(unit.plural)} von ${start} bis ${end}`,
    fieldStepRange: (count, unit, start, end) => `Alle ${count} ${unit} von ${start} bis ${end}`,
    fieldStepStart: (count, unit, start) => `Alle ${count} ${unit} ab ${start}`,
    join: (parts) => parts.join(', '),
    exampleLabels: {
      '*/15 * * * *': 'Alle 15 Minuten',
      '0 * * * *': 'Zu jeder vollen Stunde',
      '0 9 * * 1-5': 'Werktags um 09:00',
      '30 6 1 * *': 'Monatlich am Tag 1 um 06:30',
      '0 0 1 1 *': 'Jahrlich am 1. Januar',
      '@daily': 'Taglich um Mitternacht',
      '@reboot': 'Beim Neustart',
    },
    unix: 'Unix',
    aws: 'AWS',
    convertTo: (format) => `In ${format} umwandeln`,
    fieldUnspecified: 'kein bestimmter Wert',
    fieldLast: 'letzter Tag des Monats',
    fieldLastWeekday: (day) => `letzter ${day} des Monats`,
    fieldNearestWeekday: (day) => `n\u00e4chster Werktag zum ${day}.`,
    fieldNthDay: (day, nth) => `${nth}. ${day} des Monats`,
    awsExampleLabels: {
      '0 10 * * ? *': 'Jeden Tag um 10:00 UTC',
      '0/15 * ? * MON-FRI *': 'Alle 15 Min, Werktage',
      '0 8 1 * ? *': '1. des Monats um 08:00',
      '0 10 L * ? *': 'Letzter Tag des Monats um 10:00',
      '0 10 ? * 6#3 *': '3. Freitag um 10:00',
      '0 10 15W * ? *': 'Nachster Werktag zum 15.',
      '0 0 ? * 3L *': 'Letzter Dienstag um Mitternacht',
    },
    schedulePreview: 'Zeitplan-Vorschau',
    referenceTime: 'Referenzzeit',
    occurrenceCount: 'Anzeigen',
    upcoming: 'Kommende',
    previous: 'Vorherige',
    noOccurrences: 'Keine Ausfuehrungen gefunden',
    timeFromNow: (diff) => `in ${diff}`,
    timeAgo: (diff) => `vor ${diff}`,
  },
}

export const unitLabels: Record<Language, Record<CronFieldType, UnitLabel>> = {
  en: {
    minute: { singular: 'minute', plural: 'minutes', valuePrefix: 'at minute', everyLabel: 'every minute' },
    hour: { singular: 'hour', plural: 'hours', valuePrefix: 'at hour', everyLabel: 'every hour' },
    dayOfMonth: { singular: 'day of the month', plural: 'days of the month', valuePrefix: 'on day', everyLabel: 'every day of the month' },
    month: { singular: 'month', plural: 'months', valuePrefix: 'in', everyLabel: 'every month' },
    dayOfWeek: { singular: 'day of the week', plural: 'days of the week', valuePrefix: 'on', everyLabel: 'every day of the week' },
    year: { singular: 'year', plural: 'years', valuePrefix: 'in', everyLabel: 'every year' },
  },
  it: {
    minute: { singular: 'minuto', plural: 'minuti', valuePrefix: 'al minuto', everyLabel: 'ogni minuto' },
    hour: { singular: 'ora', plural: 'ore', valuePrefix: 'alle ore', everyLabel: 'ogni ora' },
    dayOfMonth: { singular: 'giorno del mese', plural: 'giorni del mese', valuePrefix: 'il giorno', everyLabel: 'ogni giorno del mese' },
    month: { singular: 'mese', plural: 'mesi', valuePrefix: 'a', everyLabel: 'ogni mese' },
    dayOfWeek: { singular: 'giorno della settimana', plural: 'giorni della settimana', valuePrefix: 'di', everyLabel: 'ogni giorno della settimana' },
    year: { singular: 'anno', plural: 'anni', valuePrefix: 'nel', everyLabel: 'ogni anno' },
  },
  es: {
    minute: { singular: 'minuto', plural: 'minutos', valuePrefix: 'en el minuto', everyLabel: 'cada minuto' },
    hour: { singular: 'hora', plural: 'horas', valuePrefix: 'a la hora', everyLabel: 'cada hora' },
    dayOfMonth: { singular: 'dia del mes', plural: 'dias del mes', valuePrefix: 'el dia', everyLabel: 'cada dia del mes' },
    month: { singular: 'mes', plural: 'meses', valuePrefix: 'en', everyLabel: 'cada mes' },
    dayOfWeek: { singular: 'dia de la semana', plural: 'dias de la semana', valuePrefix: 'los', everyLabel: 'cada dia de la semana' },
    year: { singular: 'ano', plural: 'anos', valuePrefix: 'en', everyLabel: 'cada ano' },
  },
  fr: {
    minute: { singular: 'minute', plural: 'minutes', valuePrefix: 'a la minute', everyLabel: 'chaque minute' },
    hour: { singular: 'heure', plural: 'heures', valuePrefix: 'a l heure', everyLabel: 'chaque heure' },
    dayOfMonth: { singular: 'jour du mois', plural: 'jours du mois', valuePrefix: 'le jour', everyLabel: 'chaque jour du mois' },
    month: { singular: 'mois', plural: 'mois', valuePrefix: 'en', everyLabel: 'chaque mois' },
    dayOfWeek: { singular: 'jour de la semaine', plural: 'jours de la semaine', valuePrefix: 'le', everyLabel: 'chaque jour de la semaine' },
    year: { singular: 'annee', plural: 'annees', valuePrefix: 'en', everyLabel: 'chaque annee' },
  },
  de: {
    minute: { singular: 'Minute', plural: 'Minuten', valuePrefix: 'in Minute', everyLabel: 'jede Minute' },
    hour: { singular: 'Stunde', plural: 'Stunden', valuePrefix: 'in Stunde', everyLabel: 'jede Stunde' },
    dayOfMonth: { singular: 'Tag des Monats', plural: 'Tage des Monats', valuePrefix: 'am Tag', everyLabel: 'jeder Tag des Monats' },
    month: { singular: 'Monat', plural: 'Monate', valuePrefix: 'im', everyLabel: 'jeder Monat' },
    dayOfWeek: { singular: 'Wochentag', plural: 'Wochentage', valuePrefix: 'am', everyLabel: 'jeder Wochentag' },
    year: { singular: 'Jahr', plural: 'Jahre', valuePrefix: 'im', everyLabel: 'jedes Jahr' },
  },
}

export const fieldNameKeys: Record<CronFieldType, 'tools_cronExpression_fieldMinute' | 'tools_cronExpression_fieldHour' | 'tools_cronExpression_fieldDayOfMonth' | 'tools_cronExpression_fieldMonth' | 'tools_cronExpression_fieldDayOfWeek' | 'tools_cronExpression_fieldYear'> = {
  minute: 'tools_cronExpression_fieldMinute',
  hour: 'tools_cronExpression_fieldHour',
  dayOfMonth: 'tools_cronExpression_fieldDayOfMonth',
  month: 'tools_cronExpression_fieldMonth',
  dayOfWeek: 'tools_cronExpression_fieldDayOfWeek',
  year: 'tools_cronExpression_fieldYear',
}
