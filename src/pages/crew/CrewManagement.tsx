import React, { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

interface CrewMember {
  id: string
  name: string
  email: string
  role: string
  phone: string
  skills: string[]
}

interface CrewShift {
  id: string
  memberId: string
  date: string
  start: string
  end: string
}

interface TimeOffEntry {
  id: string
  memberId: string
  start: string
  end: string
  reason: string
}

type FeedbackState = {
  type: 'success' | 'error'
  message: string
} | null

const ROLE_OPTIONS = ['Technicus', 'Planner', 'Chauffeur', 'Producer', 'Stagehand']
const TIME_OFF_REASONS = ['Vakantie', 'Ziekte', 'Training', 'Persoonlijk', 'Overig']

const INITIAL_CREW: CrewMember[] = [
  {
    id: 'crew-jan',
    name: 'Jan Jansen',
    email: 'jan@rentguy.nl',
    role: 'Technicus',
    phone: '0612345678',
    skills: ['Technicus', 'Audio'],
  },
  {
    id: 'crew-elisabeth',
    name: 'Elisabeth de Vries',
    email: 'elisabeth@rentguy.nl',
    role: 'Planner',
    phone: '0623456789',
    skills: ['Planner', 'Coördinatie'],
  },
]

function generateId(): string {
  return `crew-${Math.random().toString(36).slice(2, 10)}`
}

function normalise(value: string): string {
  return value.trim().toLowerCase()
}

function timesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map((part) => Number.parseInt(part, 10))
    return hours * 60 + minutes
  }
  const startMinutesA = toMinutes(startA)
  const endMinutesA = toMinutes(endA)
  const startMinutesB = toMinutes(startB)
  const endMinutesB = toMinutes(endB)
  return endMinutesA > startMinutesB && endMinutesB > startMinutesA
}

function dateRangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return !(endB < startA || startB > endA)
}

const CrewManagement: React.FC = () => {
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>(INITIAL_CREW)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSkill, setSelectedSkill] = useState('')

  const [showAddForm, setShowAddForm] = useState(false)
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: ROLE_OPTIONS[0],
    phone: '',
  })
  const [addFeedback, setAddFeedback] = useState<FeedbackState>(null)

  const [activeShiftMemberId, setActiveShiftMemberId] = useState<string | null>(null)
  const [shiftForm, setShiftForm] = useState({ date: '', start: '', end: '' })
  const [shiftFeedback, setShiftFeedback] = useState<FeedbackState>(null)
  const [scheduledShifts, setScheduledShifts] = useState<CrewShift[]>([])

  const [timeOffMemberId, setTimeOffMemberId] = useState<string | null>(null)
  const [timeOffForm, setTimeOffForm] = useState({
    start: '',
    end: '',
    reason: TIME_OFF_REASONS[0],
  })
  const [timeOffFeedback, setTimeOffFeedback] = useState<FeedbackState>(null)
  const [timeOffEntries, setTimeOffEntries] = useState<TimeOffEntry[]>([])

  const [availabilityOverrides, setAvailabilityOverrides] = useState<
    Record<string, 'Beschikbaar' | 'Niet beschikbaar'>
  >({})

  const skillOptions = useMemo(() => {
    const skills = new Set<string>()
    crewMembers.forEach((member) => {
      member.skills.forEach((skill) => skills.add(skill))
    })
    return Array.from(skills).sort()
  }, [crewMembers])

  const filteredMembers = useMemo(() => {
    const lowerSearch = searchTerm.trim().toLowerCase()
    return crewMembers.filter((member) => {
      const matchesSearch =
        !lowerSearch ||
        member.name.toLowerCase().includes(lowerSearch) ||
        member.email.toLowerCase().includes(lowerSearch) ||
        member.role.toLowerCase().includes(lowerSearch)
      const matchesSkill = !selectedSkill || member.skills.includes(selectedSkill)
      return matchesSearch && matchesSkill
    })
  }, [crewMembers, searchTerm, selectedSkill])

  const resolvedAvailability = useMemo(() => {
    const overrides = new Map(Object.entries(availabilityOverrides))
    timeOffEntries.forEach((entry) => {
      overrides.set(entry.memberId, 'Niet beschikbaar')
    })
    return overrides
  }, [availabilityOverrides, timeOffEntries])

  const crewSchedule = useMemo(() => {
    return scheduledShifts.map((shift) => {
      const member = crewMembers.find((crew) => crew.id === shift.memberId)
      return {
        ...shift,
        memberName: member?.name ?? 'Onbekend crewlid',
      }
    })
  }, [crewMembers, scheduledShifts])

  const handleAddCrewMember = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAddFeedback(null)

    const name = newMember.name.trim()
    const email = newMember.email.trim()
    const phone = newMember.phone.trim()

    if (!name || !email || !phone) {
      setAddFeedback({ type: 'error', message: 'Vul alle velden in' })
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAddFeedback({ type: 'error', message: 'Ongeldig e-mailadres' })
      return
    }

    const exists = crewMembers.some((member) => normalise(member.email) === normalise(email))
    if (exists) {
      setAddFeedback({ type: 'error', message: 'Crewlid bestaat al' })
      return
    }

    const createdMember: CrewMember = {
      id: generateId(),
      name,
      email,
      role: newMember.role,
      phone,
      skills: [newMember.role],
    }

    setCrewMembers((previous) => [...previous, createdMember])
    setAvailabilityOverrides((previous) => ({ ...previous, [createdMember.id]: 'Beschikbaar' }))
    setAddFeedback({ type: 'success', message: 'Crewlid succesvol toegevoegd' })
    setShowAddForm(false)
    setNewMember({ name: '', email: '', role: ROLE_OPTIONS[0], phone: '' })
  }

  const handleScheduleShift = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeShiftMemberId) return

    setShiftFeedback(null)

    if (!shiftForm.date || !shiftForm.start || !shiftForm.end) {
      setShiftFeedback({ type: 'error', message: 'Vul alle velden in' })
      return
    }

    if (shiftForm.end <= shiftForm.start) {
      setShiftFeedback({ type: 'error', message: 'Eindtijd moet later zijn dan starttijd' })
      return
    }

    const hasConflict = scheduledShifts.some(
      (shift) =>
        shift.memberId === activeShiftMemberId &&
        shift.date === shiftForm.date &&
        timesOverlap(shift.start, shift.end, shiftForm.start, shiftForm.end),
    )

    if (hasConflict) {
      setShiftFeedback({ type: 'error', message: 'Conflict met bestaande shift' })
      return
    }

    const newShift: CrewShift = {
      id: generateId(),
      memberId: activeShiftMemberId,
      date: shiftForm.date,
      start: shiftForm.start,
      end: shiftForm.end,
    }

    setScheduledShifts((previous) => [...previous, newShift])
    setShiftFeedback({ type: 'success', message: 'Shift succesvol ingepland' })
    setActiveShiftMemberId(null)
    setShiftForm({ date: '', start: '', end: '' })
  }

  const handleRequestTimeOff = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!timeOffMemberId) return

    setTimeOffFeedback(null)

    if (!timeOffForm.start || !timeOffForm.end) {
      setTimeOffFeedback({ type: 'error', message: 'Vul alle velden in' })
      return
    }

    if (new Date(timeOffForm.end) < new Date(timeOffForm.start)) {
      setTimeOffFeedback({ type: 'error', message: 'Eindtijd moet na startdatum liggen' })
      return
    }

    const overlap = timeOffEntries.some(
      (entry) =>
        entry.memberId === timeOffMemberId &&
        dateRangesOverlap(entry.start, entry.end, timeOffForm.start, timeOffForm.end),
    )

    if (overlap) {
      setTimeOffFeedback({ type: 'error', message: 'Overlappende periode' })
      return
    }

    const request: TimeOffEntry = {
      id: generateId(),
      memberId: timeOffMemberId,
      start: timeOffForm.start,
      end: timeOffForm.end,
      reason: timeOffForm.reason,
    }

    setTimeOffEntries((previous) => [...previous, request])
    setAvailabilityOverrides((previous) => ({ ...previous, [timeOffMemberId]: 'Niet beschikbaar' }))
    setTimeOffFeedback({ type: 'success', message: 'Beschikbaarheid geregistreerd' })
    setTimeOffMemberId(null)
    setTimeOffForm({ start: '', end: '', reason: TIME_OFF_REASONS[0] })
  }

  const activeShiftMember = crewMembers.find((member) => member.id === activeShiftMemberId)
  const activeTimeOffMember = crewMembers.find((member) => member.id === timeOffMemberId)

  return (
    <div className="space-y-8 p-4">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Crewbeheer</h1>
          <p className="text-sm text-slate-600">
            Registreer crewleden, plan shifts en beheer tijdelijke afwezigheid.
          </p>
        </div>
        <button
          type="button"
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          data-testid="add-crew-button"
          onClick={() => {
            setShowAddForm((previous) => !previous)
            setAddFeedback(null)
          }}
        >
          Nieuw crewlid
        </button>
      </header>

      <section className="grid gap-4 rounded-md border border-slate-200 p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col text-sm font-medium text-slate-700">
          Zoeken
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="mt-2 rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Zoek op naam, e-mail of rol"
            data-testid="crew-search-input"
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-700">
          Filter op skill
          <select
            value={selectedSkill}
            onChange={(event) => setSelectedSkill(event.target.value)}
            className="mt-2 rounded border border-slate-300 px-3 py-2 text-sm"
            data-testid="crew-skill-filter"
          >
            <option value="">Alle skills</option>
            {skillOptions.map((skill) => (
              <option key={skill} value={skill}>
                {skill}
              </option>
            ))}
          </select>
        </label>
      </section>

      {showAddForm && (
        <form
          onSubmit={handleAddCrewMember}
          className="space-y-4 rounded-md border border-slate-200 p-4 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-900">Crewlid registreren</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col text-sm font-medium text-slate-700">
              Naam
              <input
                type="text"
                value={newMember.name}
                onChange={(event) =>
                  setNewMember((previous) => ({ ...previous, name: event.target.value }))
                }
                className="mt-2 rounded border border-slate-300 px-3 py-2 text-sm"
                data-testid="name-input"
                placeholder="Jan Jansen"
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-700">
              E-mailadres
              <input
                type="email"
                value={newMember.email}
                onChange={(event) =>
                  setNewMember((previous) => ({ ...previous, email: event.target.value }))
                }
                className="mt-2 rounded border border-slate-300 px-3 py-2 text-sm"
                data-testid="email-input"
                placeholder="jan@rentguy.nl"
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-700">
              Rol
              <select
                value={newMember.role}
                onChange={(event) =>
                  setNewMember((previous) => ({ ...previous, role: event.target.value }))
                }
                className="mt-2 rounded border border-slate-300 px-3 py-2 text-sm"
                data-testid="role-select"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-700">
              Telefoonnummer
              <input
                type="tel"
                value={newMember.phone}
                onChange={(event) =>
                  setNewMember((previous) => ({ ...previous, phone: event.target.value }))
                }
                className="mt-2 rounded border border-slate-300 px-3 py-2 text-sm"
                data-testid="phone-input"
                placeholder="0612345678"
              />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
              data-testid="submit-crew-button"
            >
              Crewlid toevoegen
            </button>
            <button
              type="button"
              className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => setShowAddForm(false)}
            >
              Annuleren
            </button>
          </div>
          {addFeedback && (
            <p
              className={
                addFeedback.type === 'error'
                  ? 'text-sm font-medium text-red-600'
                  : 'text-sm font-medium text-emerald-600'
              }
            >
              {addFeedback.message}
            </p>
          )}
        </form>
      )}

      <section className="overflow-x-auto rounded-md border border-slate-200 shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
                Naam
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
                Rol
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
                Skills
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
                Beschikbaarheid
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
                Contact
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
                Acties
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200" data-testid="crew-list">
            {filteredMembers.map((member) => {
              const availability = resolvedAvailability.get(member.id) ?? 'Beschikbaar'
              return (
                <tr key={member.id} className="bg-white">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{member.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{member.role}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    <div className="flex flex-wrap gap-2">
                      {member.skills.map((skill) => (
                        <span
                          key={`${member.id}-${skill}`}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold">
                    <span
                      className={
                        availability === 'Niet beschikbaar'
                          ? 'rounded bg-rose-100 px-2 py-1 text-rose-700'
                          : 'rounded bg-emerald-100 px-2 py-1 text-emerald-700'
                      }
                      data-testid="availability-status"
                    >
                      {availability}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    <div className="space-y-1">
                      <p>{member.email}</p>
                      <p>{member.phone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        data-testid="schedule-shift-button"
                        onClick={() => {
                          setActiveShiftMemberId(member.id)
                          setShiftFeedback(null)
                        }}
                      >
                        Plan shift
                      </button>
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        data-testid="request-timeoff-button"
                        onClick={() => {
                          setTimeOffMemberId(member.id)
                          setTimeOffFeedback(null)
                        }}
                      >
                        Beschikbaarheid
                      </button>
                      <Link
                        to={`/crew/${member.id}`}
                        className="rounded border border-transparent px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Details
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filteredMembers.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={6}>
                  Geen crewleden gevonden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {activeShiftMember && (
        <form
          onSubmit={handleScheduleShift}
          className="space-y-4 rounded-md border border-slate-200 p-4 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-900">
            Shift plannen voor {activeShiftMember.name}
          </h2>
          <label className="flex flex-col text-sm font-medium text-slate-700">
            Datum
            <input
              type="date"
              value={shiftForm.date}
              onChange={(event) =>
                setShiftForm((previous) => ({ ...previous, date: event.target.value }))
              }
              className="mt-2 rounded border border-slate-300 px-3 py-2 text-sm"
              data-testid="shift-date-input"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col text-sm font-medium text-slate-700">
              Starttijd
              <input
                type="time"
                value={shiftForm.start}
                onChange={(event) =>
                  setShiftForm((previous) => ({ ...previous, start: event.target.value }))
                }
                className="mt-2 rounded border border-slate-300 px-3 py-2 text-sm"
                data-testid="shift-start-input"
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-700">
              Eindtijd
              <input
                type="time"
                value={shiftForm.end}
                onChange={(event) =>
                  setShiftForm((previous) => ({ ...previous, end: event.target.value }))
                }
                className="mt-2 rounded border border-slate-300 px-3 py-2 text-sm"
                data-testid="shift-end-input"
              />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
              data-testid="submit-shift-button"
            >
              Bevestig shift
            </button>
            <button
              type="button"
              className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => setActiveShiftMemberId(null)}
            >
              Annuleren
            </button>
          </div>
        </form>
      )}
      {shiftFeedback && (
        <p
          className={
            shiftFeedback.type === 'error'
              ? 'text-sm font-medium text-red-600'
              : 'text-sm font-medium text-emerald-600'
          }
        >
          {shiftFeedback.message}
        </p>
      )}

      {activeTimeOffMember && (
        <form
          onSubmit={handleRequestTimeOff}
          className="space-y-4 rounded-md border border-slate-200 p-4 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-900">
            Beschikbaarheid registreren voor {activeTimeOffMember.name}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col text-sm font-medium text-slate-700">
              Startdatum
              <input
                type="date"
                value={timeOffForm.start}
                onChange={(event) =>
                  setTimeOffForm((previous) => ({ ...previous, start: event.target.value }))
                }
                className="mt-2 rounded border border-slate-300 px-3 py-2 text-sm"
                data-testid="timeoff-start"
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-700">
              Einddatum
              <input
                type="date"
                value={timeOffForm.end}
                onChange={(event) =>
                  setTimeOffForm((previous) => ({ ...previous, end: event.target.value }))
                }
                className="mt-2 rounded border border-slate-300 px-3 py-2 text-sm"
                data-testid="timeoff-end"
              />
            </label>
          </div>
          <label className="flex flex-col text-sm font-medium text-slate-700">
            Reden
            <select
              value={timeOffForm.reason}
              onChange={(event) =>
                setTimeOffForm((previous) => ({ ...previous, reason: event.target.value }))
              }
              className="mt-2 rounded border border-slate-300 px-3 py-2 text-sm"
              data-testid="timeoff-reason"
            >
              {TIME_OFF_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
              data-testid="submit-timeoff-button"
            >
              Opslaan
            </button>
            <button
              type="button"
              className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => setTimeOffMemberId(null)}
            >
              Annuleren
            </button>
          </div>
        </form>
      )}
      {timeOffFeedback && (
        <p
          className={
            timeOffFeedback.type === 'error'
              ? 'text-sm font-medium text-red-600'
              : 'text-sm font-medium text-emerald-600'
          }
        >
          {timeOffFeedback.message}
        </p>
      )}

      <section className="space-y-3 rounded-md border border-slate-200 p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Ingeplande shifts</h2>
        <div data-testid="crew-schedule" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {crewSchedule.length === 0 && (
            <p className="text-sm text-slate-600">Nog geen shifts ingepland.</p>
          )}
          {crewSchedule.map((shift) => (
            <article
              key={shift.id}
              className="rounded border border-slate-200 bg-white p-3 text-sm shadow-sm"
            >
              <h3 className="font-semibold text-slate-900">{shift.memberName}</h3>
              <p className="text-slate-700">
                {shift.date} · {shift.start} – {shift.end}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default CrewManagement
