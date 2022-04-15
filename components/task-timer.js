// export class TaskTimer extends HTMLElement {

class TaskTimer {
    constructor(selector, options) {
        // super()

        this.element = document.querySelector(selector);
        this.animationId = false;

        const defaultOptions = {
            size: 100,
            stroke: 10,
            arc: false,
            time: 20*60,
            sectorColor: '#789',
            circleColor: '#DDD',
            fillCircle: true
        };

        // Merge options with default ones
        options = Object.assign(defaultOptions, options);

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

        this.element.innerHTML = svg;
        this.svg    = this.element.childNodes[0];
        this.testPt = this.svg.createSVGPoint();
        this.sector = this.element.querySelector('.TaskTimer-sector');

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

        // start -> starting line
        // end -> will path be closed or not
        let end = '';
        let start = null;

        if (options.arc) {
            start = `M${options.center},${options.stroke / 2}`;
        } else {
            start = `M${options.center},${options.center} L${options.center},${options.stroke / 2}`;
            end = 'z';
        }

        return `${start} ${firstArc} ${secondArc} ${end}`;
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

    getSector() {
        const options = this.options;

        // Colors
        const sectorFill = options.arc ? 'none' : options.sectorColor;
        const sectorStroke = options.arc ? options.sectorColor : 'none';

        const d = this.getSectorD()

        return `<path
            class='TaskTimer-sector'
            stroke-width='${options.stroke}'
            fill=${sectorFill}
            stroke=${sectorStroke}
            d='${d}' />`;
    }

    getCircle() {
        const options = this.options;
        const circleFill = options.fillCircle || !options.arc ? options.circleColor : 'none';

        return `<circle
            class='TaskTimer-circle'
            stroke-width='${options.stroke}'
            fill=${circleFill}
            stroke=${options.circleColor}
            cx='${options.center}'
            cy='${options.center}'
            r='${options.radius}' />`;
    }

    // Generates SVG arc string
    getArc(angle) {
        const options = this.options;

        const x = options.center - options.radius * Math.cos(this.radians(angle));
        const y = options.center + options.radius * Math.sin(this.radians(angle));

        return `A${options.radius},${options.radius} 0 0 0 ${x},${y}`
    }

    // Converts from degrees to radians.
    radians(degrees) {
        return degrees / 180 * Math.PI;
    }
}
