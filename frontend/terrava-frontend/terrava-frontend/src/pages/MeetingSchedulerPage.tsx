import { useEffect, useRef, useState, type FormEvent } from "react"
import "./MeetingSchedulerPage.css"

type Meeting = {
  id: string
  title: string
  client: string
  location: string
  date: string
  startTime: string
  endTime: string
  type: "Site Visit" | "Video Call" | "Office Meeting"
  reminderEnabled: boolean
  reminderTime: string
}

const STORAGE_KEY = "terrava_meetings"

function pad(value: number) {
  return value.toString().padStart(2, "0")
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function createSampleMeetings(today: Date): Meeting[] {
  const first = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  const second = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3)
  const third = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5)
  const fourth = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 8)

  return [
    {
      id: "meeting-1",
      title: "Palm Grove site visit",
      client: "Ananya Sharma",
      location: "OMR, Chennai",
      date: formatDateKey(first),
      startTime: "10:00",
      endTime: "11:00",
      type: "Site Visit",
      reminderEnabled: true,
      reminderTime: "09:15",
    },
    {
      id: "meeting-2",
      title: "Investor pricing review",
      client: "Rohan Estates",
      location: "Video call",
      date: formatDateKey(second),
      startTime: "12:30",
      endTime: "13:15",
      type: "Video Call",
      reminderEnabled: true,
      reminderTime: "11:45",
    },
    {
      id: "meeting-3",
      title: "Villa closing discussion",
      client: "Meera Nair",
      location: "Anna Nagar office",
      date: formatDateKey(third),
      startTime: "16:00",
      endTime: "17:00",
      type: "Office Meeting",
      reminderEnabled: false,
      reminderTime: "15:15",
    },
    {
      id: "meeting-4",
      title: "Weekend family showing",
      client: "Karthik Raj",
      location: "ECR beachfront plot",
      date: formatDateKey(fourth),
      startTime: "09:30",
      endTime: "10:30",
      type: "Site Visit",
      reminderEnabled: true,
      reminderTime: "08:45",
    },
  ]
}

function formatMonthTitle(date: Date) {
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
}

function formatLongDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function compareMeetings(a: Meeting, b: Meeting) {
  return `${a.date}-${a.startTime}`.localeCompare(`${b.date}-${b.startTime}`)
}

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function MeetingSchedulerPage() {
  const today = new Date()
  const todayKey = formatDateKey(today)
  const todayStart = new Date(`${todayKey}T00:00:00`)
  const initialMeetings = (() => {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved) {
      try {
        return (JSON.parse(saved) as Meeting[]).sort(compareMeetings)
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }

    return createSampleMeetings(today).sort(compareMeetings)
  })()
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(() => todayKey)
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDayMenuOpen, setIsDayMenuOpen] = useState(false)
  const reminderTimeoutsRef = useRef<number[]>([])
  const notifiedMeetingsRef = useRef<Set<string>>(new Set())
  const [form, setForm] = useState({
    title: "",
    client: "",
    location: "",
    date: todayKey,
    startTime: "10:00",
    endTime: "11:00",
    type: "Site Visit" as Meeting["type"],
    reminderEnabled: true,
    reminderTime: "09:00",
  })

  useEffect(() => {
    if (meetings.length === 0) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings))
  }, [meetings])

  useEffect(() => {
    if (!("Notification" in window)) {
      return
    }

    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

  useEffect(() => {
    reminderTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    reminderTimeoutsRef.current = []

    if (!("Notification" in window) || Notification.permission !== "granted") {
      return
    }

    const now = Date.now()

    meetings.forEach((meeting) => {
      if (!meeting.reminderEnabled || notifiedMeetingsRef.current.has(meeting.id)) {
        return
      }

      const reminderAt = new Date(`${meeting.date}T${meeting.reminderTime}:00`).getTime()
      const delay = reminderAt - now

      if (delay <= 0) {
        const overdueWindowMs = 5 * 60 * 1000
        if (now - reminderAt <= overdueWindowMs) {
          new Notification("Meeting reminder", {
            body: `${meeting.title} with ${meeting.client} at ${meeting.startTime}`,
          })
          notifiedMeetingsRef.current.add(meeting.id)
        }
        return
      }

      const timeoutId = window.setTimeout(() => {
        new Notification("Meeting reminder", {
          body: `${meeting.title} with ${meeting.client} at ${meeting.startTime}`,
        })
        notifiedMeetingsRef.current.add(meeting.id)
      }, delay)

      reminderTimeoutsRef.current.push(timeoutId)
    })

    return () => {
      reminderTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
      reminderTimeoutsRef.current = []
    }
  }, [meetings])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDayOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingBlankDays = firstDayOfMonth.getDay()
  const calendarCells: Array<Date | null> = []

  for (let index = 0; index < leadingBlankDays; index += 1) {
    calendarCells.push(null)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    calendarCells.push(new Date(year, month, day))
  }

  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null)
  }

  const selectedMeetings = meetings.filter((meeting) => meeting.date === selectedDate)
  const upcomingMeetings = meetings
    .filter((meeting) => `${meeting.date}T${meeting.startTime}` >= `${todayKey}T00:00`)
    .sort(compareMeetings)
    .slice(0, 4)

  const totalMeetings = meetings.length
  const todayMeetings = meetings.filter((meeting) => meeting.date === todayKey).length
  const thisWeekBoundary = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)
  const thisWeekMeetings = meetings.filter((meeting) => {
    const meetingDate = new Date(`${meeting.date}T00:00:00`)
    return meetingDate >= todayStart && meetingDate <= thisWeekBoundary
  }).length

  const openFormForDate = (dateKey: string) => {
    setSelectedDate(dateKey)
    setForm((current) => ({ ...current, date: dateKey }))
    setIsDayMenuOpen(false)
    setIsFormOpen(true)
  }

  const handleDateClick = (dateKey: string) => {
    setSelectedDate(dateKey)
    setForm((current) => ({ ...current, date: dateKey }))
    setIsDayMenuOpen(true)
  }

  const handleAddMeeting = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const newMeeting: Meeting = {
      id: `${Date.now()}`,
      title: form.title.trim(),
      client: form.client.trim(),
      location: form.location.trim(),
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      type: form.type,
      reminderEnabled: form.reminderEnabled,
      reminderTime: form.reminderTime,
    }

    if (!newMeeting.title || !newMeeting.client || !newMeeting.location) {
      return
    }

    const nextMeetings = [...meetings, newMeeting].sort(compareMeetings)

    if (newMeeting.reminderEnabled && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {})
    }

    setMeetings(nextMeetings)
    setSelectedDate(form.date)
    const nextViewDate = new Date(`${form.date}T00:00:00`)
    setViewDate(new Date(nextViewDate.getFullYear(), nextViewDate.getMonth(), 1))
    setForm({
      title: "",
      client: "",
      location: "",
      date: form.date,
      startTime: "10:00",
      endTime: "11:00",
      type: "Site Visit",
      reminderEnabled: true,
      reminderTime: "09:00",
    })
    setIsFormOpen(false)
  }

  const handleDeleteMeeting = (id: string) => {
    setMeetings(meetings.filter((meeting) => meeting.id !== id))
  }

  return (
    <div className="scheduler-page">
      <section className="scheduler-hero">
        <div className="scheduler-hero-copy">
          <p className="scheduler-eyebrow">Meeting Scheduler</p>
          <h1>Calendar view for meetings</h1>
          <p className="scheduler-subtitle">
            Track site visits, office meetings, and client calls in one place.
          </p>
        </div>

        <div className="scheduler-stats">
          <div className="scheduler-stat-card">
            <span className="scheduler-stat-icon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="4" />
                <path d="M8 2v4M16 2v4M3 10h18" />
              </svg>
            </span>
            <span className="scheduler-stat-label">Total</span>
            <strong>{totalMeetings}</strong>
          </div>
          <div className="scheduler-stat-card">
            <span className="scheduler-stat-icon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
            </span>
            <span className="scheduler-stat-label">Today</span>
            <strong>{todayMeetings}</strong>
          </div>
          <div className="scheduler-stat-card">
            <span className="scheduler-stat-icon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h10M4 18h7" />
              </svg>
            </span>
            <span className="scheduler-stat-label">This week</span>
            <strong>{thisWeekMeetings}</strong>
          </div>
        </div>
      </section>

      <section className="scheduler-layout">
        <div className="scheduler-calendar-panel">
          <div className="scheduler-panel-header">
            <div>
              <p className="scheduler-panel-kicker">Monthly calendar</p>
              <h2>{formatMonthTitle(viewDate)}</h2>
            </div>
            <div className="scheduler-header-actions">
              <button type="button" className="scheduler-add-trigger" onClick={() => openFormForDate(selectedDate)}>
                Add to calendar
              </button>
              <div className="scheduler-nav-actions">
              <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))}>
                Prev
              </button>
              <button type="button" onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))}>
                Today
              </button>
              <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))}>
                Next
              </button>
              </div>
            </div>
          </div>

          <div className="scheduler-weekdays">
            {weekdayLabels.map((label) => (
              <div key={label} className="scheduler-weekday">{label}</div>
            ))}
          </div>

          <div className="scheduler-grid">
            {calendarCells.map((date, index) => {
              if (!date) {
                return <div key={`blank-${index}`} className="scheduler-day scheduler-day-empty" />
              }

              const dateKey = formatDateKey(date)
              const dayMeetings = meetings.filter((meeting) => meeting.date === dateKey)
              const isToday = dateKey === todayKey
              const isSelected = dateKey === selectedDate

              return (
                <button
                  key={dateKey}
                  type="button"
                  className={`scheduler-day${isToday ? " is-today" : ""}${isSelected ? " is-selected" : ""}`}
                  onClick={() => handleDateClick(dateKey)}
                >
                  <div className="scheduler-day-top">
                    <span className="scheduler-day-number">{date.getDate()}</span>
                    {dayMeetings.length > 0 && (
                      <span className="scheduler-day-count">{dayMeetings.length}</span>
                    )}
                  </div>

                  <div className="scheduler-day-meetings">
                    {dayMeetings.slice(0, 2).map((meeting) => (
                      <span key={meeting.id} className="scheduler-chip">
                        {meeting.startTime} {meeting.title}
                      </span>
                    ))}
                    {dayMeetings.length > 2 && (
                      <span className="scheduler-more">+{dayMeetings.length - 2} more</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <aside className="scheduler-sidebar">
          <div className="scheduler-agenda-card">
            <div className="scheduler-panel-header compact">
              <div>
                <p className="scheduler-panel-kicker">Selected day</p>
                <h2>{formatLongDate(selectedDate)}</h2>
              </div>
              <div className="scheduler-agenda-actions">
                <button type="button" className="scheduler-view-button" onClick={() => setIsDayMenuOpen(true)}>
                  View
                </button>
                <button type="button" className="scheduler-add-trigger secondary" onClick={() => openFormForDate(selectedDate)}>
                  Add
                </button>
              </div>
            </div>

            <div className="scheduler-agenda-list">
              {selectedMeetings.length === 0 && (
                <div className="scheduler-empty">
                  <strong>No meetings planned</strong>
                  <p>Click a date in the calendar or use Add to calendar.</p>
                </div>
              )}

              {selectedMeetings.map((meeting) => (
                <article key={meeting.id} className="scheduler-meeting-card">
                  <div className="scheduler-meeting-meta">
                    <span className="meeting-type">{meeting.type}</span>
                    <button type="button" onClick={() => handleDeleteMeeting(meeting.id)}>
                      Remove
                    </button>
                  </div>
                  <h3>{meeting.title}</h3>
                  <p>{meeting.client}</p>
                  <ul>
                    <li>{meeting.startTime} - {meeting.endTime}</li>
                    <li>{meeting.location}</li>
                    <li>{meeting.reminderEnabled ? `Reminder at ${meeting.reminderTime}` : "Reminder off"}</li>
                  </ul>
                </article>
              ))}
            </div>
          </div>

          <div className="scheduler-upcoming-card">
            <div className="scheduler-panel-header compact">
              <div>
                <p className="scheduler-panel-kicker">Upcoming</p>
                <h2>Next meetings</h2>
              </div>
            </div>

            <div className="scheduler-upcoming-list">
              {upcomingMeetings.map((meeting) => (
                <div key={meeting.id} className="scheduler-upcoming-item">
                  <div>
                    <strong>{meeting.title}</strong>
                    <p>{meeting.client}</p>
                  </div>
                  <span>{new Date(`${meeting.date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      {isFormOpen && (
        <div className="scheduler-modal-backdrop" role="presentation" onClick={() => setIsFormOpen(false)}>
          <div className="scheduler-modal" role="dialog" aria-modal="true" aria-labelledby="scheduler-modal-title" onClick={(event) => event.stopPropagation()}>
            <form className="scheduler-form-card scheduler-form-modal" onSubmit={handleAddMeeting}>
              <div className="scheduler-panel-header compact">
                <div>
                  <p className="scheduler-panel-kicker">New meeting</p>
                  <h2 id="scheduler-modal-title">Add to calendar</h2>
                </div>
                <button type="button" className="scheduler-close-button" onClick={() => setIsFormOpen(false)}>
                  Close
                </button>
              </div>

              <div className="scheduler-form-grid">
                <label>
                  Meeting title
                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Client property visit"
                    required
                  />
                </label>

                <label>
                  Client name
                  <input
                    type="text"
                    value={form.client}
                    onChange={(event) => setForm((current) => ({ ...current, client: event.target.value }))}
                    placeholder="Client name"
                    required
                  />
                </label>

                <label>
                  Location
                  <input
                    type="text"
                    value={form.location}
                    onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                    placeholder="Office, site, or call link"
                    required
                  />
                </label>

                <label>
                  Date
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                    required
                  />
                </label>

                <label>
                  Start time
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
                    required
                  />
                </label>

                <label>
                  End time
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))}
                    required
                  />
                </label>

                <label>
                  Meeting type
                  <select
                    value={form.type}
                    onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as Meeting["type"] }))}
                  >
                    <option value="Site Visit">Site Visit</option>
                    <option value="Office Meeting">Office Meeting</option>
                    <option value="Video Call">Video Call</option>
                  </select>
                </label>

                <label>
                  Reminder
                  <select
                    value={form.reminderEnabled ? "yes" : "no"}
                    onChange={(event) => setForm((current) => ({ ...current, reminderEnabled: event.target.value === "yes" }))}
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>

                {form.reminderEnabled && (
                  <label>
                    Reminder time
                    <input
                      type="time"
                      value={form.reminderTime}
                      onChange={(event) => setForm((current) => ({ ...current, reminderTime: event.target.value }))}
                      required
                    />
                  </label>
                )}
              </div>

              <button type="submit" className="scheduler-submit">
                Save meeting
              </button>
            </form>
          </div>
        </div>
      )}

      {isDayMenuOpen && (
        <div className="scheduler-modal-backdrop" role="presentation" onClick={() => setIsDayMenuOpen(false)}>
          <div
            className="scheduler-modal scheduler-day-menu-wrap"
            role="dialog"
            aria-modal="true"
            aria-labelledby="scheduler-day-menu-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="scheduler-day-menu">
              <div className="scheduler-panel-header compact">
                <div>
                  <p className="scheduler-panel-kicker">Selected date</p>
                  <h2 id="scheduler-day-menu-title">{formatLongDate(selectedDate)}</h2>
                </div>
                <button type="button" className="scheduler-close-button" onClick={() => setIsDayMenuOpen(false)}>
                  Close
                </button>
              </div>

              <div className="scheduler-day-menu-actions">
                <button type="button" className="scheduler-view-button" onClick={() => setIsDayMenuOpen(false)}>
                  View schedule
                </button>
                <button type="button" className="scheduler-add-trigger" onClick={() => openFormForDate(selectedDate)}>
                  Add to calendar
                </button>
              </div>

              <div className="scheduler-day-menu-preview">
                {selectedMeetings.length === 0 && (
                  <div className="scheduler-empty">
                    <strong>No meetings planned</strong>
                    <p>Add a meeting for this date.</p>
                  </div>
                )}

                {selectedMeetings.slice(0, 3).map((meeting) => (
                  <article key={meeting.id} className="scheduler-meeting-card compact">
                    <div className="scheduler-meeting-meta">
                      <span className="meeting-type">{meeting.type}</span>
                    </div>
                    <h3>{meeting.title}</h3>
                    <p>{meeting.startTime} - {meeting.endTime}</p>
                    <p>{meeting.reminderEnabled ? `Reminder ${meeting.reminderTime}` : "Reminder off"}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
