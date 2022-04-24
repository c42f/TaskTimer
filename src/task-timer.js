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
                <path
                    class='TotalTimeIndicator'
                    stroke-width='${s}'
                    fill='none'
                    stroke='#DDD'
                    d=''/>
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
                    class='ExtendedTimeIndicator'
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
        this.extendedTimeIndicator = this.querySelector('.ExtendedTimeIndicator');
        this.totalTimeIndicator = this.querySelector('.TotalTimeIndicator');

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
        this.setPaused(true);
        this.setTimeRemaining(secs);
        this.totalTime = secs;
        this.setTimeBar(this.totalTimeIndicator, secs);
    }

    setTimeRemaining(secs) {
        this.timeRemaining = secs;
        if (secs > 0) {
            this.setTimeBar(this.timeIndicator, secs)
            this.setTimeBar(this.extendedTimeIndicator, 0);
        }
        else {
            this.setTimeBar(this.timeIndicator, 0);
            this.setTimeBar(this.extendedTimeIndicator, secs);
        }
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

    setTimeBar(timeIndicator, time) {
        const angle = -360 * time/this.fullCircleTime;
        timeIndicator.setAttribute('d', this.getTimeIndicatorPath(angle));
    }

    // Get SVG path string for an arc from the top of the timer clock. Positive
    // angles are measured clockwise from top in degrees (increasing negative
    // angles count backward).
    getTimeIndicatorPath(angle) {
        const c = this.options.center;
        const r = this.options.radius;

        // We draw this as two connected arcs to avoid the singularity in
        // representing a full circle with a single arc.

        // Start of arc at angle `a0 == 0`:
        const x0 = c;
        const y0 = c - r;
        // Middle of arc
        const a1 = angle / 180 * Math.PI / 2;
        const x1 = c + r * Math.sin(a1);
        const y1 = c - r * Math.cos(a1);
        // End of arc
        const a2 = 2 * a1;
        const x2 = c + r * Math.sin(a2);
        const y2 = c - r * Math.cos(a2);

        const sweepFlag = angle < 0 ? '0' : '1';

        return `M${x0},${y0}
            A${r},${r} 0 0 ${sweepFlag} ${x1},${y1}
            A${r},${r} 0 0 ${sweepFlag} ${x2},${y2}
        `
    }
}

if (!window.customElements.get('task-timer')) {
  window.TaskTimer = TaskTimer
  window.customElements.define('task-timer', TaskTimer)
}
