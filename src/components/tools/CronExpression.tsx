import { For, Show, createMemo, createSignal, onMount, onCleanup } from 'solid-js'
import { decodeState, TOOL_STATE_REQUEST, TOOL_STATE_RESPONSE } from '../../lib/share'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { StatusMessage } from '../ui/StatusMessage'
import { t, translateError } from '../../i18n'
import type { Language } from '../../i18n'
import { cronExamples, awsCronExamples, parseCronExpression, convertCron, getNextOccurrences, getPreviousOccurrences, isAnyField } from '../../tools/cron-expression'
import type { CronExpressionResult, CronField, CronFieldType, CronSegment, CronFormat } from '../../tools/cron-expression'

interface Props {
  lang: Language
}

type BuilderMode = 'everyMinutes' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'lastDay' | 'nthWeekday'

type UnitLabel = { singular: string; plural: string; valuePrefix: string; everyLabel: string }

type PhraseSet = {
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

const phraseSets: Record<Language, PhraseSet> = {
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
    fieldNthDay: (day, nth) => `${nth}° ${day} del mese`,
    awsExampleLabels: {
      '0 10 * * ? *': 'Ogni giorno alle 10:00 UTC',
      '0/15 * ? * MON-FRI *': 'Ogni 15 min, feriali',
      '0 8 1 * ? *': '1° del mese alle 08:00',
      '0 10 L * ? *': 'Ultimo giorno alle 10:00',
      '0 10 ? * 6#3 *': '3° venerdi alle 10:00',
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
    fieldNthDay: (day, nth) => `${nth}° ${day} del mes`,
    awsExampleLabels: {
      '0 10 * * ? *': 'Cada dia a las 10:00 UTC',
      '0/15 * ? * MON-FRI *': 'Cada 15 min, laborables',
      '0 8 1 * ? *': '1° del mes a las 08:00',
      '0 10 L * ? *': 'Ultimo dia del mes a las 10:00',
      '0 10 ? * 6#3 *': '3° viernes a las 10:00',
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
    fieldNearestWeekday: (day) => `nächster Werktag zum ${day}.`,
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

const unitLabels: Record<Language, Record<CronFieldType, UnitLabel>> = {
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

const fieldNameKeys: Record<CronFieldType, 'tools_cronExpression_fieldMinute' | 'tools_cronExpression_fieldHour' | 'tools_cronExpression_fieldDayOfMonth' | 'tools_cronExpression_fieldMonth' | 'tools_cronExpression_fieldDayOfWeek' | 'tools_cronExpression_fieldYear'> = {
  minute: 'tools_cronExpression_fieldMinute',
  hour: 'tools_cronExpression_fieldHour',
  dayOfMonth: 'tools_cronExpression_fieldDayOfMonth',
  month: 'tools_cronExpression_fieldMonth',
  dayOfWeek: 'tools_cronExpression_fieldDayOfWeek',
  year: 'tools_cronExpression_fieldYear',
}

export default function CronExpression(props: Props) {
  const initialExpression = '*/15 * * * *'
  const initialParsed = parseCronExpression(initialExpression)
  const initialResult = initialParsed.ok ? initialParsed.value : null
  const initialError = initialParsed.ok ? null : translateError(props.lang, initialParsed.error)

  const [input, setInput] = createSignal(initialExpression)
  const [result, setResult] = createSignal<CronExpressionResult | null>(initialResult)
  const [error, setError] = createSignal<string | null>(initialError)
  const [builderMode, setBuilderMode] = createSignal<BuilderMode>('everyMinutes')
  const [builderMinute, setBuilderMinute] = createSignal('0')
  const [builderHour, setBuilderHour] = createSignal('9')
  const [builderStep, setBuilderStep] = createSignal('15')
  const [builderDayOfWeek, setBuilderDayOfWeek] = createSignal('1')
  const [builderDayOfMonth, setBuilderDayOfMonth] = createSignal('1')
  const [builderFormat, setBuilderFormat] = createSignal<CronFormat>('unix')
  const [builderNthWeek, setBuilderNthWeek] = createSignal('1')
  const [builderAwsDayOfWeek, setBuilderAwsDayOfWeek] = createSignal('2')

  const [scheduleRefTime, setScheduleRefTime] = createSignal<string>(formatDateTimeLocal(new Date()))
  const [scheduleCount, setScheduleCount] = createSignal('5')

  onMount(async () => {
    const saved = await decodeState(new URLSearchParams(location.search).get('s'))
    if (saved) {
      if (typeof saved['input'] === 'string') setInput(saved['input'])
      if (typeof saved['builderMode'] === 'string') setBuilderMode(saved['builderMode'] as BuilderMode)
      if (typeof saved['builderMinute'] === 'string') setBuilderMinute(saved['builderMinute'])
      if (typeof saved['builderHour'] === 'string') setBuilderHour(saved['builderHour'])
      if (typeof saved['builderStep'] === 'string') setBuilderStep(saved['builderStep'])
      if (typeof saved['builderDayOfWeek'] === 'string') setBuilderDayOfWeek(saved['builderDayOfWeek'])
      if (typeof saved['builderDayOfMonth'] === 'string') setBuilderDayOfMonth(saved['builderDayOfMonth'])
      if (typeof saved['builderFormat'] === 'string') setBuilderFormat(saved['builderFormat'] as CronFormat)
      if (typeof saved['builderNthWeek'] === 'string') setBuilderNthWeek(saved['builderNthWeek'])
      if (typeof saved['builderAwsDayOfWeek'] === 'string') setBuilderAwsDayOfWeek(saved['builderAwsDayOfWeek'])
    }
    const handler = () => {
      window.dispatchEvent(new CustomEvent(TOOL_STATE_RESPONSE, {
        detail: { state: { input: input(), builderMode: builderMode(), builderMinute: builderMinute(), builderHour: builderHour(), builderStep: builderStep(), builderDayOfWeek: builderDayOfWeek(), builderDayOfMonth: builderDayOfMonth(), builderFormat: builderFormat(), builderNthWeek: builderNthWeek(), builderAwsDayOfWeek: builderAwsDayOfWeek() } },
      }))
    }
    window.addEventListener(TOOL_STATE_REQUEST, handler)
    onCleanup(() => window.removeEventListener(TOOL_STATE_REQUEST, handler))
  })

  const explainExpression = (expression: string) => {
    const parsed = parseCronExpression(expression)
    if (parsed.ok) {
      setInput(expression)
      setResult(parsed.value)
      setError(null)

      // Auto-detect format and sync builder toggle
      setBuilderFormat(parsed.value.format)
      return
    }

    setResult(null)
    setError(translateError(props.lang, parsed.error))
  }

  const handleInput = (value: string) => {
    setInput(value)
    if (!value.trim()) {
      setResult(null)
      setError(null)

      return
    }
    const parsed = parseCronExpression(value)
    if (parsed.ok) {
      setResult(parsed.value)
      setError(null)

      setBuilderFormat(parsed.value.format)
    } else {
      setResult(null)
      setError(translateError(props.lang, parsed.error))

    }
  }

  const buildBuilderExpression = (overrides?: Partial<{
    mode: BuilderMode
    minute: string
    hour: string
    step: string
    dayOfWeek: string
    dayOfMonth: string
    format: CronFormat
    nthWeek: string
    awsDayOfWeek: string
  }>) => {
    const mode = overrides?.mode ?? builderMode()
    const minute = overrides?.minute ?? builderMinute()
    const hour = overrides?.hour ?? builderHour()
    const step = overrides?.step ?? builderStep()
    const dayOfWeek = overrides?.dayOfWeek ?? builderDayOfWeek()
    const dayOfMonth = overrides?.dayOfMonth ?? builderDayOfMonth()
    const format = overrides?.format ?? builderFormat()
    const nthWeek = overrides?.nthWeek ?? builderNthWeek()
    const awsDow = overrides?.awsDayOfWeek ?? builderAwsDayOfWeek()

    if (format === 'aws') {
      if (mode === 'everyMinutes') return `*/${step} * * * ? *`
      if (mode === 'hourly') return `${minute} * * * ? *`
      if (mode === 'daily') return `${minute} ${hour} * * ? *`
      if (mode === 'weekly') return `${minute} ${hour} ? * ${awsDow} *`
      if (mode === 'monthly') return `${minute} ${hour} ${dayOfMonth} * ? *`
      if (mode === 'lastDay') return `${minute} ${hour} L * ? *`
      if (mode === 'nthWeekday') return `${minute} ${hour} ? * ${awsDow}#${nthWeek} *`
    }

    if (mode === 'everyMinutes') return `*/${step} * * * *`
    if (mode === 'hourly') return `${minute} * * * *`
    if (mode === 'daily') return `${minute} ${hour} * * *`
    if (mode === 'weekly') return `${minute} ${hour} * * ${dayOfWeek}`
    return `${minute} ${hour} ${dayOfMonth} * *`
  }

  const applyExample = (expression: string) => {
    explainExpression(expression)
  }

  const applyBuilder = (overrides?: Partial<{
    mode: BuilderMode
    minute: string
    hour: string
    step: string
    dayOfWeek: string
    dayOfMonth: string
    format: CronFormat
    nthWeek: string
    awsDayOfWeek: string
  }>) => {
    explainExpression(buildBuilderExpression(overrides))
  }

  const conversionCheck = () => {
    const current = result()
    if (!current) return null
    const targetFormat: CronFormat = current.format === 'unix' ? 'aws' : 'unix'
    return convertCron(current, targetFormat)
  }

  const handleConvert = () => {
    const check = conversionCheck()
    if (check?.ok) {
      explainExpression(check.value.normalizedExpression)
    }
  }

  const minuteOptions = () => createNumberOptions(0, 59)
  const hourOptions = () => createNumberOptions(0, 23)
  const stepOptions = () => ['5', '10', '15', '20', '30'].map((value) => ({ value, label: value }))
  const dayOfMonthOptions = () => createNumberOptions(1, 31)
  const dayOfWeekOptions = () => createWeekdayOptions(props.lang)
  function formatDateTimeLocal(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
  }

  function formatTimeDiff(ms: number): string {
    const abs = Math.abs(ms)
    const minutes = Math.floor(abs / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const remHours = hours % 24
    const remMinutes = minutes % 60
    const parts: string[] = []
    if (days > 0) parts.push(`${days}d`)
    if (remHours > 0) parts.push(`${remHours}h`)
    if (remMinutes > 0 || parts.length === 0) parts.push(`${remMinutes}m`)
    return parts.join(' ')
  }

  const scheduleNext = createMemo(() => {
    const r = result()
    if (!r) return []
    const refDate = new Date(scheduleRefTime() + ':00Z')
    if (isNaN(refDate.getTime())) return []
    return getNextOccurrences(r, Number(scheduleCount()), refDate)
  })

  const schedulePrev = createMemo(() => {
    const r = result()
    if (!r) return []
    const refDate = new Date(scheduleRefTime() + ':00Z')
    if (isNaN(refDate.getTime())) return []
    return getPreviousOccurrences(r, Number(scheduleCount()), refDate)
  })

  return (
    <div class="flex flex-col gap-5">
      <section class="rounded-xl border border-border bg-surface-raised p-4">
        <div class="mb-3 flex items-center gap-3">
          <p class="text-sm font-medium text-text-secondary">{phraseSets[props.lang].builder}</p>
          <div class="flex gap-1">
            <Button
              variant={builderFormat() === 'unix' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                setBuilderFormat('unix')
                const mode = builderMode()
                if (mode === 'lastDay' || mode === 'nthWeekday') {
                  setBuilderMode('everyMinutes')
                  applyBuilder({ format: 'unix', mode: 'everyMinutes' })
                } else {
                  applyBuilder({ format: 'unix' })
                }
              }}
            >
              Unix
            </Button>
            <Button
              variant={builderFormat() === 'aws' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                setBuilderFormat('aws')
                applyBuilder({ format: 'aws' })
              }}
            >
              AWS
            </Button>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <For each={(Object.keys(phraseSets[props.lang].builderModes) as BuilderMode[]).filter(
            (mode) => builderFormat() === 'aws' || (mode !== 'lastDay' && mode !== 'nthWeekday')
          )}>
            {(mode) => (
              <Button
                variant={builderMode() === mode ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  setBuilderMode(mode)
                  applyBuilder({ mode })
                }}
              >
                {phraseSets[props.lang].builderModes[mode]}
              </Button>
            )}
          </For>
        </div>

        <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Show when={builderMode() === 'everyMinutes'}>
            <Select
              label={phraseSets[props.lang].builderStep}
              options={stepOptions()}
              value={builderStep()}
              onChange={(event) => {
                const value = event.currentTarget.value
                setBuilderStep(value)
                applyBuilder({ step: value })
              }}
            />
          </Show>

          <Show when={builderMode() !== 'everyMinutes'}>
            <Select
              label={phraseSets[props.lang].builderMinute}
              options={minuteOptions()}
              value={builderMinute()}
              onChange={(event) => {
                const value = event.currentTarget.value
                setBuilderMinute(value)
                applyBuilder({ minute: value })
              }}
            />
          </Show>

          <Show when={builderMode() === 'daily' || builderMode() === 'weekly' || builderMode() === 'monthly' || builderMode() === 'lastDay' || builderMode() === 'nthWeekday'}>
            <Select
              label={phraseSets[props.lang].builderHour}
              options={hourOptions()}
              value={builderHour()}
              onChange={(event) => {
                const value = event.currentTarget.value
                setBuilderHour(value)
                applyBuilder({ hour: value })
              }}
            />
          </Show>

          <Show when={builderMode() === 'weekly' && builderFormat() === 'unix'}>
            <Select
              label={phraseSets[props.lang].builderDayOfWeek}
              options={dayOfWeekOptions()}
              value={builderDayOfWeek()}
              onChange={(event) => {
                const value = event.currentTarget.value
                setBuilderDayOfWeek(value)
                applyBuilder({ dayOfWeek: value })
              }}
            />
          </Show>

          <Show when={builderMode() === 'weekly' && builderFormat() === 'aws'}>
            <Select
              label={phraseSets[props.lang].builderDayOfWeek}
              options={createAwsWeekdayOptions(props.lang)}
              value={builderAwsDayOfWeek()}
              onChange={(event) => {
                const value = event.currentTarget.value
                setBuilderAwsDayOfWeek(value)
                applyBuilder({ awsDayOfWeek: value })
              }}
            />
          </Show>

          <Show when={builderMode() === 'monthly'}>
            <Select
              label={phraseSets[props.lang].builderDayOfMonth}
              options={dayOfMonthOptions()}
              value={builderDayOfMonth()}
              onChange={(event) => {
                const value = event.currentTarget.value
                setBuilderDayOfMonth(value)
                applyBuilder({ dayOfMonth: value })
              }}
            />
          </Show>

          <Show when={builderMode() === 'nthWeekday'}>
            <Select
              label={phraseSets[props.lang].builderDayOfWeek}
              options={createAwsWeekdayOptions(props.lang)}
              value={builderAwsDayOfWeek()}
              onChange={(event) => {
                const value = event.currentTarget.value
                setBuilderAwsDayOfWeek(value)
                applyBuilder({ awsDayOfWeek: value })
              }}
            />
            <Select
              label="#"
              options={Array.from({ length: 5 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
              value={builderNthWeek()}
              onChange={(event) => {
                const value = event.currentTarget.value
                setBuilderNthWeek(value)
                applyBuilder({ nthWeek: value })
              }}
            />
          </Show>
        </div>

        <div class="mt-4">
          <Input
            label={t(props.lang, 'tools_cronExpression_inputLabel')}
            placeholder={t(props.lang, 'tools_cronExpression_placeholder')}
            value={input()}
            onInput={(event) => handleInput(event.currentTarget.value)}
          />
        </div>

        <Show when={error()}>
          <div class="mt-3">
            <StatusMessage type="error" message={error()!} />
          </div>
        </Show>

        <Show when={result()}>
          {(parsed) => (
            <div class="mt-4 rounded-lg border border-border bg-surface p-3" data-testid="cron-summary">
              <div class="flex flex-wrap items-center gap-2">
                <span class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  parsed().format === 'aws'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                }`} data-testid="format-badge">
                  {parsed().format === 'aws' ? phraseSets[props.lang].aws : phraseSets[props.lang].unix}
                </span>
                <p class="text-lg font-semibold text-text-primary">{formatSummary(parsed(), props.lang)}</p>
                <Show when={conversionCheck()?.ok} fallback={
                  <span class="text-xs text-text-muted italic">{conversionCheck()?.ok === false ? conversionCheck()!.error.message : ''}</span>
                }>
                  <Button variant="secondary" size="sm" onClick={handleConvert}>
                    {phraseSets[props.lang].convertTo(parsed().format === 'aws' ? 'Unix' : 'AWS')}
                  </Button>
                </Show>
              </div>
            </div>
          )}
        </Show>
      </section>

      <div class="rounded-xl border border-border bg-surface-raised p-4">
        <p class="mb-3 text-sm font-medium text-text-secondary">{phraseSets[props.lang].examples}</p>
        <div class="flex flex-wrap gap-2">
          <Show when={builderFormat() === 'aws'} fallback={
            <For each={cronExamples}>
              {(example) => (
                <Button variant="secondary" size="sm" onClick={() => applyExample(example)}>
                  <span class="font-mono">{example}</span>
                  <span class="text-text-muted">{phraseSets[props.lang].exampleLabels[example]}</span>
                </Button>
              )}
            </For>
          }>
            <For each={awsCronExamples}>
              {(example) => (
                <Button variant="secondary" size="sm" onClick={() => applyExample(example)}>
                  <span class="font-mono">{example}</span>
                  <span class="text-text-muted">{phraseSets[props.lang].awsExampleLabels[example]}</span>
                </Button>
              )}
            </For>
          </Show>
        </div>
      </div>

      <Show when={result()}>
        {(parsed) => (
          <div class="flex flex-col gap-4">

            <Show when={parsed().fields.length > 0}>
              <section>
                <p class="mb-3 text-sm font-medium text-text-secondary">{phraseSets[props.lang].fields}</p>
                <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <For each={parsed().fields}>
                    {(field) => (
                      <div class="rounded-lg border border-border bg-surface-raised p-3">
                        <div class="flex items-center justify-between gap-3">
                          <p class="text-sm font-medium text-text-primary">{t(props.lang, fieldNameKeys[field.type])}</p>
                          <code class="rounded bg-surface px-2 py-1 text-xs text-text-secondary">{field.expression}</code>
                        </div>
                        <p class="mt-2 text-sm text-text-secondary">{describeField(field, props.lang, parsed().format)}</p>
                      </div>
                    )}
                  </For>
                </div>
              </section>
            </Show>

            <section class="rounded-xl border border-border bg-surface-raised p-4" data-testid="schedule-preview">
              <p class="mb-3 text-sm font-medium text-text-secondary">{phraseSets[props.lang].schedulePreview}</p>
              <div class="flex flex-wrap items-end gap-3 mb-4">
                <div class="flex flex-col gap-1">
                  <label class="text-xs text-text-muted">{phraseSets[props.lang].referenceTime} (UTC)</label>
                  <input
                    type="datetime-local"
                    class="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
                    value={scheduleRefTime()}
                    onInput={(e) => setScheduleRefTime(e.currentTarget.value)}
                  />
                </div>
                <Select
                  label={phraseSets[props.lang].occurrenceCount}
                  options={[
                    { value: '5', label: '5' },
                    { value: '10', label: '10' },
                    { value: '20', label: '20' },
                  ]}
                  value={scheduleCount()}
                  onChange={(e) => setScheduleCount(e.currentTarget.value)}
                />
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <p class="mb-2 text-xs font-medium text-text-muted">{phraseSets[props.lang].previous}</p>
                  <Show when={schedulePrev().length > 0} fallback={
                    <p class="text-xs text-text-muted italic">{phraseSets[props.lang].noOccurrences}</p>
                  }>
                    <ul class="flex flex-col gap-1">
                      <For each={schedulePrev()}>
                        {(date) => {
                          const refDate = new Date(scheduleRefTime() + ':00Z')
                          const diff = refDate.getTime() - date.getTime()
                          return (
                            <li class="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
                              <span class="font-mono text-text-primary">
                                {date.toISOString().replace('T', ' ').slice(0, 16)} UTC
                              </span>
                              <span class="text-text-muted">
                                {phraseSets[props.lang].timeAgo(formatTimeDiff(diff))}
                              </span>
                            </li>
                          )
                        }}
                      </For>
                    </ul>
                  </Show>
                </div>

                <div>
                  <p class="mb-2 text-xs font-medium text-text-muted">{phraseSets[props.lang].upcoming}</p>
                  <Show when={scheduleNext().length > 0} fallback={
                    <p class="text-xs text-text-muted italic">{phraseSets[props.lang].noOccurrences}</p>
                  }>
                    <ul class="flex flex-col gap-1">
                      <For each={scheduleNext()}>
                        {(date) => {
                          const refDate = new Date(scheduleRefTime() + ':00Z')
                          const diff = date.getTime() - refDate.getTime()
                          return (
                            <li class="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
                              <span class="font-mono text-text-primary">
                                {date.toISOString().replace('T', ' ').slice(0, 16)} UTC
                              </span>
                              <span class="text-text-muted">
                                {phraseSets[props.lang].timeFromNow(formatTimeDiff(diff))}
                              </span>
                            </li>
                          )
                        }}
                      </For>
                    </ul>
                  </Show>
                </div>
              </div>
            </section>
          </div>
        )}
      </Show>
    </div>
  )
}

function isAnyOrUnspecified(f: CronField): boolean {
  return isAnyField(f) || (f.segments.length === 1 && f.segments[0]!.kind === 'unspecified')
}

function formatSummary(result: CronExpressionResult, lang: Language): string {
  const phrases = phraseSets[lang]
  if (result.shortcut === '@reboot') {
    return phrases.atEveryReboot
  }

  const minute = result.fields.find((field) => field.type === 'minute')
  const hour = result.fields.find((field) => field.type === 'hour')
  const dayOfMonth = result.fields.find((field) => field.type === 'dayOfMonth')
  const month = result.fields.find((field) => field.type === 'month')
  const dayOfWeek = result.fields.find((field) => field.type === 'dayOfWeek')

  if (!minute || !hour || !dayOfMonth || !month || !dayOfWeek) {
    return result.normalizedExpression
  }

  if (isAnyField(minute) && isAnyField(hour) && isAnyOrUnspecified(dayOfMonth) && isAnyField(month) && isAnyOrUnspecified(dayOfWeek)) {
    return phrases.everyMinute
  }

  const minuteValue = getSingleValue(minute)
  const hourValue = getSingleValue(hour)
  const minuteEvery = getEveryStep(minute)

  if (minuteEvery !== null && isAnyField(hour) && isAnyOrUnspecified(dayOfMonth) && isAnyField(month) && isAnyOrUnspecified(dayOfWeek)) {
    return phrases.everyStep(minuteEvery, unitLabels[lang].minute.plural)
  }

  if (minuteValue !== null && hourValue !== null && isAnyOrUnspecified(dayOfMonth) && isAnyField(month) && isAnyOrUnspecified(dayOfWeek)) {
    return phrases.atTime(hourValue, minuteValue)
  }

  if (minuteValue !== null && isAnyField(hour) && isAnyOrUnspecified(dayOfMonth) && isAnyField(month) && isAnyOrUnspecified(dayOfWeek)) {
    return phrases.atMinutePastEveryHour(minuteValue)
  }

  const meaningfulFields = result.fields.filter((f) => {
    if (f.segments.length === 1 && f.segments[0]!.kind === 'unspecified') return false
    if (f.type === 'year' && isAnyField(f)) return false
    return true
  })

  return phrases.join(meaningfulFields.map((field) => describeField(field, lang, result.format)))
}

function describeField(field: CronField, lang: Language, format: CronFormat = 'unix'): string {
  const phrases = phraseSets[lang]
  if (field.segments.length === 1) {
    return describeSegment(field.type, field.segments[0]!, lang, format)
  }

  return phrases.join(field.segments.map((segment) => describeSegment(field.type, segment, lang, format)))
}

function formatAwsDow(value: number, lang: Language): string {
  const dateIndex = value - 1
  return new Intl.DateTimeFormat(phraseSets[lang].locale, { weekday: 'long', timeZone: 'UTC' })
    .format(new Date(Date.UTC(2024, 0, 7 + dateIndex)))
}

function formatOrdinal(n: number, lang: Language): string {
  if (phraseSets[lang].locale.startsWith('en')) {
    const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' }
    return `${n}${(n >= 11 && n <= 13) ? 'th' : (suffixes[n % 10] ?? 'th')}`
  }
  return `${n}`
}

function describeSegment(fieldType: CronFieldType, segment: CronSegment, lang: Language, format: CronFormat = 'unix'): string {
  const phrases = phraseSets[lang]
  const labels = unitLabels[lang][fieldType]

  switch (segment.kind) {
    case 'any':
      return phrases.fieldAny(labels)
    case 'value':
      return phrases.fieldValue(labels, formatFieldValue(fieldType, segment.value, lang, format))
    case 'range':
      return phrases.fieldRange(
        labels,
        formatFieldValue(fieldType, segment.start, lang, format),
        formatFieldValue(fieldType, segment.end, lang, format),
      )
    case 'step':
      if (segment.base.kind === 'any') {
        return phrases.everyStep(segment.every, labels.plural)
      }
      if (segment.base.kind === 'value') {
        return phrases.fieldStepStart(
          segment.every,
          labels.plural,
          formatFieldValue(fieldType, segment.base.value, lang, format),
        )
      }
      return phrases.fieldStepRange(
        segment.every,
        labels.plural,
        formatFieldValue(fieldType, segment.base.start, lang, format),
        formatFieldValue(fieldType, segment.base.end, lang, format),
      )
    case 'unspecified':
      return phrases.fieldUnspecified
    case 'last':
      return phrases.fieldLast
    case 'lastWeekday':
      return phrases.fieldLastWeekday(formatAwsDow(segment.day, lang))
    case 'nearestWeekday':
      return phrases.fieldNearestWeekday(formatOrdinal(segment.day, lang))
    case 'nthDay':
      return phrases.fieldNthDay(formatAwsDow(segment.day, lang), formatOrdinal(segment.nth, lang))
  }
}

function formatFieldValue(fieldType: CronFieldType, value: number, lang: Language, format: CronFormat = 'unix'): string {
  if (fieldType === 'year') return String(value)

  if (fieldType === 'month') {
    return new Intl.DateTimeFormat(phraseSets[lang].locale, { month: 'long', timeZone: 'UTC' })
      .format(new Date(Date.UTC(2024, value - 1, 1)))
  }

  if (fieldType === 'dayOfWeek') {
    // AWS DOW: 1=SUN..7=SAT, Unix DOW: 0-7 where 0,7=SUN
    if (format === 'aws') {
      return formatAwsDow(value, lang)
    }
    const normalized = value === 7 ? 0 : value
    return new Intl.DateTimeFormat(phraseSets[lang].locale, { weekday: 'long', timeZone: 'UTC' })
      .format(new Date(Date.UTC(2024, 0, 7 + normalized)))
  }

  return String(value)
}

function getSingleValue(field: CronField): number | null {
  if (field.segments.length !== 1) return null
  const segment = field.segments[0]!
  return segment.kind === 'value' ? segment.value : null
}

function getEveryStep(field: CronField): number | null {
  if (field.segments.length !== 1) return null
  const segment = field.segments[0]!
  return segment.kind === 'step' && segment.base.kind === 'any' ? segment.every : null
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function createNumberOptions(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => {
    const value = String(start + index)
    return {
      value,
      label: value.padStart(2, '0'),
    }
  })
}

function createWeekdayOptions(lang: Language) {
  return Array.from({ length: 7 }, (_, index) => ({
    value: String(index),
    label: new Intl.DateTimeFormat(phraseSets[lang].locale, { weekday: 'long', timeZone: 'UTC' })
      .format(new Date(Date.UTC(2024, 0, 7 + index))),
  }))
}

function createAwsWeekdayOptions(lang: Language) {
  return Array.from({ length: 7 }, (_, i) => ({
    value: String(i + 1),
    label: new Intl.DateTimeFormat(phraseSets[lang].locale, { weekday: 'long', timeZone: 'UTC' })
      .format(new Date(Date.UTC(2024, 0, 7 + i))),
  }))
}
