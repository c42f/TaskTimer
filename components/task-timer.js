// export class TaskTimer extends HTMLElement {

class TaskTimer extends HTMLElement {
    constructor() {
        super()

        this.animationId = false;

        let options = {
              size: 200,
              stroke: 30,
              arc: true,
              time: 20*60,
              circleColor: '#DDD'
        };

        // Reset stroke to 0 if drawing full sector
        options.stroke = options.arc ? options.stroke : 0;

        // Circle dimenstions
        options.center = options.size / 2;
        options.radius = options.stroke ? options.center - (options.stroke) / 2 : options.center;

        this.options = options;

        this.checkAngle();

        const tickR1 = options.size / 2;
        const tickR2 = options.size / 2 - options.stroke;
        var tickMarks = ''
        // 1 minute ticks
        for (var i = 0; i < 60; i += 1) {
            const angle = 2*Math.PI * i/60;
            const x1 = options.center - tickR1 * Math.cos(angle);
            const y1 = options.center + tickR1 * Math.sin(angle);
            const x2 = options.center - tickR2 * Math.cos(angle);
            const y2 = options.center + tickR2 * Math.sin(angle);

            var tickClass = (i % 5 == 0) ? "FiveMinuteTicks" : "OneMinuteTicks"

            tickMarks = `${tickMarks}
              <line class="${tickClass}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`
        }

        const svg =
            `<svg class='TaskTimer' viewBox='0 0 ${options.size} ${options.size}'>
                ${this.getCircle()}
                ${tickMarks}
                ${this.getSector()}
            </svg>`
        this.innerHTML = svg;
        this.svg    = this.childNodes[0];

        this.testPt = this.svg.createSVGPoint();
        this.sector = this.querySelector('.TaskTimer-sector');

        this.timeRemaining = options.time;
        this.isPaused = true;
        this.setTimeBar(options.time);
    }

    checkAngle() {
        if (this.options.angle > 360) {
            this.options.angle =  this.options.angle % 360;
        }
    }

    changeAngle(angle) {
        this.options.angle = angle;
        this.checkAngle();
        this.sector.setAttribute('d', this.getSectorD());
    }

    cancelAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = false;
        }
    }

    setTimeBar(timeRemaining) {
        const angle = 360 * timeRemaining/3600;
        this.changeAngle(angle);
    }

    stepTimer(previousTickMs) {
        const now = new Date().valueOf()
        this.timeRemaining -= (now - previousTickMs)/1000;

        if (this.timeRemaining > 0) {
            this.setTimeBar(this.timeRemaining);
            this.animationId = requestAnimationFrame(() => this.stepTimer(now));
        }
        else {
            this.isPaused = true;
            this.changeAngle(0);
        }
    }

    startTimer(secs) {
        this.options.time = secs;
        this.timeRemaining = secs;
        this.isPaused = false;

        this.cancelAnimation();
        this.animationId = requestAnimationFrame(() => this.stepTimer(new Date().valueOf()));
    }

    togglePaused() {
        if (this.isPaused && this.timeRemaining > 0) {
            this.isPaused = false;
            this.animationId = requestAnimationFrame(() => this.stepTimer(new Date().valueOf()));
        }
        else {
            this.isPaused = true;
            this.cancelAnimation();
        }
    }

    getSectorD() {
        const options = this.options;

        // Arc angles
        const firstAngle = options.angle > 180 ? 90 : options.angle - 90;
        const secondAngle = -270 + options.angle - 180;

        // Arcs
        const firstArc = this.getArc(firstAngle, options);
        const secondArc = options.angle > 180 ? this.getArc(secondAngle, options) : '';

        return `M${options.center},${options.stroke / 2} ${firstArc} ${secondArc}`;
    }

    getSector() {
        const options = this.options;

        const d = this.getSectorD()

        return `<path
            class='TaskTimer-sector'
            stroke-width='${options.stroke}'
            fill='none'
            stroke='#bD2828'
            d='${d}' />`;
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

    getCircle() {
        const options = this.options;

        return `<circle
            class='TaskTimer-circle'
            stroke-width='${options.stroke}'
            fill='none'
            stroke=${options.circleColor}
            cx='${options.center}'
            cy='${options.center}'
            r='${options.radius}' />`;
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
