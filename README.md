# A visual task timer

`<task-timer>` is a web component to help with time awareness by visually
showing the passage of time.

![Screenshot](screenshot.png)

Timers like this can help combat time blindness by showing time as space. In
this timer, the full circle always represents a single hour of time. I think
this is nice because
* There's a *stable correspondence between time and space* in the angle
  around the circle, regardless of where you choose to start the timer.
* A maximum of one hour is a *good human scale for time*: large enough to get
  started on something but not too intimidating. Few-minute tasks can still be
  measured.
* It's *familiar* from the analog clock face

It's possible to get physical versions of timers like this, for example the
[Time Timer](https://www.timetimer.com).

Thanks to `@Stanko` for the [Sektor library](https://github.com/Stanko/sektor)
which gave initial inspiration for the approach here of using an animated svg.
