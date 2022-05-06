class TaskTimer extends HTMLElement {
    constructor() {
        super()

        this.animationId = false;

        let options = {
            size: 200,
            stroke: 30,
        };

        // Circle dimenstions
        const c = options.size / 2;
        const s = options.stroke;
        const r = c - s/2;

        options.center = c;
        options.radius = r;

        this.options = options;
        this.fullCircleTime = 3600;

        const tickR1 = options.size / 2;
        const tickR2 = options.size / 2 - options.stroke;
        var fiveMinuteTickMarks = ''
        var oneMinuteTickMarks = ''
        // 1 minute ticks
        for (var i = 0; i < 60; i += 1) {
            const angle = 2*Math.PI * i/60;
            const x1 = c - tickR1 * Math.cos(angle);
            const y1 = c + tickR1 * Math.sin(angle);
            const x2 = c - tickR2 * Math.cos(angle);
            const y2 = c + tickR2 * Math.sin(angle);

            const line = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`
            if (i % 5 == 0) {
                fiveMinuteTickMarks = `${fiveMinuteTickMarks} ${line}`
            }
            else {
                oneMinuteTickMarks = `${oneMinuteTickMarks} ${line}`
            }
        }

        const svg_text =
            `<svg class='TaskTimer' viewBox='0 0 200 200'>
                <circle
                    class='TimeIndicatorBackground'
                    stroke-width='${s}'
                    fill='none'
                    stroke='#CCC'
                    cx='${c}'
                    cy='${c}'
                    r='${r}'
                />
                <g class="StartStopButton">
                    <circle
                        cx='${c}'
                        cy='${c}'
                        r='${r*0.4}'
                        fill='#F8F8F8'
                    />
                    <polygon class='StartIcon'
                        points='${c-15},${c-17} ${c-15},${c+17} ${c+17},${c}'
                        fill='#999'
                        stroke='#999'
                        stroke-linejoin='round'
                        stroke-width='10'
                        visibility='visible'
                    />
                    <g class='PauseIcon'
                        fill='none'
                        stroke='#999'
                        stroke-linecap='round'
                        stroke-width='10'
                        visibility='visible'
                    >
                        <line x1='${c-15}' y1='${c-17}' x2='${c-15}' y2='${c+17}'/>
                        <line x1='${c+15}' y1='${c-17}' x2='${c+15}' y2='${c+17}'/>
                    </g>
                </g>
                <path
                    class='CompletedTimeIndicator'
                    stroke-width='${s}'
                    fill='none'
                    stroke='#DDD'
                    d=''/>
                <g class='OneMinuteTickMarks'
                    stroke='#EEE'
                    stroke-width='0.5'
                >
                    ${oneMinuteTickMarks}
                </g>
                <g class='FiveMinuteTickMarks'
                    stroke='#EEE'
                    stroke-width='1.5'
                >
                    ${fiveMinuteTickMarks}
                </g>
                <path
                    class='TimeIndicator'
                    stroke-width='${s}'
                    fill='none'
                    stroke='#bD2828'
                    d=''/>
                <path
                    class='StartTimeIndicator'
                    stroke-width='${s}'
                    fill='none'
                    stroke='#555'
                    d=''/>
                <circle
                    class='TimeIndicatorForeground'
                    stroke-width='${s}'
                    fill='none'
                    stroke='none'
                    cx='${c}'
                    cy='${c}'
                    r='${r}'
                    pointer-events='stroke'
                />
            </svg>`

        this.innerHTML = svg_text;
        this.svg    = this.childNodes[0];

        this.testPt = this.svg.createSVGPoint();
        this.timeIndicator = this.querySelector('.TimeIndicator');
        this.completedTimeIndicator = this.querySelector('.CompletedTimeIndicator');
        this.startTimeIndicator = this.querySelector('.StartTimeIndicator');

        this.setTotalTime(20*60);

        this.querySelector('.StartStopButton').addEventListener('click',
            e => this.togglePaused()
        );

        this.querySelector('.TimeIndicatorForeground').addEventListener('click',
            e => this.startTimer(this.getTimeClick(e))
        );
    }

    cancelAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = false;
        }
    }

    stepTimer(previousTickMs) {
        const now = new Date().valueOf();
        let timeRemaining = this.timeRemaining - (now - previousTickMs)/1000;
        if (this.totalTime - timeRemaining < this.fullCircleTime) {
            this.animationId = requestAnimationFrame(() => this.stepTimer(now));
        }
        else {
            timeRemaining = this.totalTime - this.fullCircleTime;
            this.setPaused(true);
        }
        this.setTimeRemaining(timeRemaining);
    }

    startTimer(secs) {
        this.setTotalTime(secs);
        this.setPaused(false);
    }

    setTotalTime(secs) {
        if (secs > this.fullCircleTime) {
            secs = this.fullCircleTime;
        }
        this.setPaused(true);
        this.setTimeRemaining(secs);
        this.totalTime = secs;
        // A small bar at start of the time period lets us see remaining time
        // reducing immediately when the timer starts.
        this.setTimeBar(this.startTimeIndicator, secs, secs + 0.002*this.fullCircleTime)
    }

    setTimeRemaining(secs) {
        this.timeRemaining = secs;
        this.setTimeBar(this.timeIndicator, secs > 0 ? secs : 0, 0)
        this.setTimeBar(this.completedTimeIndicator, this.totalTime, secs);
    }

    setPaused(paused) {
        this.cancelAnimation();
        if (!paused && this.timeRemaining > 0) {
            this.isPaused = false;
            this.querySelector('.StartIcon').setAttribute('visibility', 'hidden');
            this.querySelector('.PauseIcon').setAttribute('visibility', 'visible');
            this.animationId = requestAnimationFrame(() => this.stepTimer(new Date().valueOf()));
        }
        else {
            this.isPaused = true;
            this.querySelector('.StartIcon').setAttribute('visibility', 'visible');
            this.querySelector('.PauseIcon').setAttribute('visibility', 'hidden');
        }
    }

    togglePaused() {
        this.setPaused(!this.isPaused);
    }

    // Get time which the user clicked on
    getTimeClick(event) {
        const testPt = this.testPt;
        testPt.x = event.clientX;
        testPt.y = event.clientY;
        // The cursor point in svg coordinates
        const p = testPt.matrixTransform(this.svg.getScreenCTM().inverse());
        const x = p.x - this.options.center;
        const y = p.y - this.options.center;

        // Return number of seconds which was clicked on
        return this.fullCircleTime * (Math.atan2(x, y) + Math.PI)/(2*Math.PI);
    }

    // private

    setTimeBar(timeIndicator, time1, time2) {
        const angle1 = -360*time1/this.fullCircleTime;
        const angle2 = -360*time2/this.fullCircleTime;
        timeIndicator.setAttribute('d', this.getArcPath(angle1, angle2));
    }

    // Get SVG path string for an arc from the top of the timer clock. Positive
    // angles are measured clockwise from top in degrees (increasing negative
    // angles count backward).
    getArcPath(angle1, angle2) {
        if (angle1 == angle2) {
            return ``;
        }
        else if (angle2 < angle1) {
            [angle2, angle1] = [angle1, angle2];
        }

        const c = this.options.center;
        const r = this.options.radius;

        const a1 = angle1 / 180 * Math.PI;
        const a2 = angle2 / 180 * Math.PI;

        // Start of arc at angle `a0 == 0`:
        const x1 = c + r * Math.sin(a1);
        const y1 = c - r * Math.cos(a1);
        // End of arc
        const x2 = c + r * Math.sin(a2);
        const y2 = c - r * Math.cos(a2);

        // If necessary we draw this as two connected arcs to avoid the
        // singularity in representing a full circle with a single arc.
        let midArc = ``;
        if (angle2 - angle1 > 180) {
            console.log(angle2 - angle1);
            const am = (a1 + a2)/2;
            const xm = c + r * Math.sin(am);
            const ym = c - r * Math.cos(am);
            midArc = `A${r},${r} 0 0 1 ${xm},${ym}`;
        }

        const p = `M${x1},${y1}
            ${midArc}
            A${r},${r} 0 0 1 ${x2},${y2}
        `;
        console.log(p);
        return p;
    }
}

if (!window.customElements.get('task-timer')) {
  window.TaskTimer = TaskTimer
  window.customElements.define('task-timer', TaskTimer)
}
