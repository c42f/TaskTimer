class TaskTimer extends HTMLElement {
    constructor() {
        super()

        this.animationId = false;

        let options = {
              size: 200,
              stroke: 30,
              time: 20*60,
              circleColor: '#DDD'
        };

        // Circle dimenstions
        const c = options.size / 2;
        const s = options.stroke;
        const r = c - s/2;

        options.center = c;
        options.radius = r;

        this.options = options;

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
                    stroke=${options.circleColor}
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

        this.timeRemaining = options.time;
        this.setPaused(true);
        this.setTimeBar(options.time);

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

    setTimeBar(timeRemaining) {
        this.setAngle(360 * timeRemaining/3600);
    }

    stepTimer(previousTickMs) {
        const now = new Date().valueOf()
        this.timeRemaining -= (now - previousTickMs)/1000;

        if (this.timeRemaining > 0) {
            this.setTimeBar(this.timeRemaining);
            this.animationId = requestAnimationFrame(() => this.stepTimer(now));
        }
        else {
            this.setAngle(0);
            setPaused(true);
        }
    }

    startTimer(secs) {
        this.options.time = secs;
        this.timeRemaining = secs;
        this.setPaused(false);
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
        return 3600 * (Math.atan2(x, y) + Math.PI)/(2*Math.PI);
    }

    setAngle(angle) {
        this.timeIndicator.setAttribute('d', this.getTimeIndicatorArcs(angle));
    }

    // private

    getTimeIndicatorArcs(angle) {
        const options = this.options;

        const firstAngle = angle > 180 ? 90 : angle - 90;
        const secondAngle = -270 + angle - 180;

        const firstArc = this.getArc(firstAngle, options);
        const secondArc = angle > 180 ? this.getArc(secondAngle, options) : '';

        return `M${options.center},${options.stroke / 2} ${firstArc} ${secondArc}`;
    }

    // Generates SVG arc string
    getArc(angle) {
        const options = this.options;

        const x = options.center - options.radius * Math.cos(this.deg2rad(angle));
        const y = options.center + options.radius * Math.sin(this.deg2rad(angle));

        return `A${options.radius},${options.radius} 0 0 0 ${x},${y}`
    }

    // Converts from degrees to radians.
    deg2rad(degrees) {
        return degrees / 180 * Math.PI;
    }
}

if (!window.customElements.get('task-timer')) {
  window.TaskTimer = TaskTimer
  window.customElements.define('task-timer', TaskTimer)
}
