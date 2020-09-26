import chalk, { Chalk } from 'chalk';

import diffLogs from './log-diff';
import * as Templates from './log-templates';
import { LogMessage, Task } from './types';

const REFRESH_INTERVAL_MS = 200;
const DEFAULT_COLOR_METHOD = (c: string) => c;

/**
 * Logger for updating the terminal with current status
 * - Updates are printed based on `REFRESH_INTERVAL_MS`
 * - Should be ran on main thread separate from worker threads in order to
 *   avoid blocking updates
 */
class ProgressLogger {
    /** Messages printed as a list under tasks */
    messages: LogMessage[];

    /** Messages of the task runners */
    tasks: Task[];

    /** Count of finished repositories */
    scannedRepositories: number;

    /** Handle of refresh interval */
    intervalHandle: NodeJS.Timeout;

    /** Contents of previous log. Used to diff new contents */
    previousLog: string;

    /** Colors of previous log */
    previousColors: Chalk[];

    constructor() {
        this.messages = [];
        this.tasks = [];
        this.scannedRepositories = 0;

        const startPrinting = () => {
            this.previousLog = '';
            this.previousColors = [];

            console.clear();
            this.intervalHandle = setInterval(() => {
                this.print();
            }, REFRESH_INTERVAL_MS);
        };

        // On terminal size change full print is required
        process.stdout.on('resize', () => {
            if (this.intervalHandle !== null) {
                // This will stop current printing immediately
                clearTimeout(this.intervalHandle);
                this.intervalHandle = null;

                // Reset printing status and start over in order to recover from terminal size change
                startPrinting();
            }
        });

        startPrinting();
    }

    /**
     * Clear refresh interval
     */
    onAllRepositoriesScanned() {
        this.messages.push({
            content: `[DONE] Finished scan of ${this.scannedRepositories} repositories`,
            color: chalk.green,
        });

        // Stop updating afer one final printing
        setTimeout(() => {
            clearTimeout(this.intervalHandle);
        }, REFRESH_INTERVAL_MS);
    }

    /**
     * Apply updates to given task
     */
    updateTask(repository: string, updates: Omit<Task, 'repository'>) {
        const taskExists = this.tasks.find(
            task => task.repository === repository
        );

        if (taskExists) {
            this.tasks = this.tasks.map(task => {
                if (task.repository !== repository) {
                    return task;
                }

                return { ...task, ...updates };
            });
        } else {
            this.tasks.push({ repository, ...updates });
        }
    }

    /**
     * Apply warning to given task. Duplicate warnings are ignored.
     * Returns boolean indicating whether warning did not exist on task already
     */
    addWarningToTask(repository: string, warning: string): boolean {
        const task = this.tasks.find(task => task.repository === repository);

        if (task) {
            const warnings = task.warnings || [];
            const hasWarnedAlready = warnings.includes(warning);

            if (!hasWarnedAlready) {
                this.updateTask(repository, {
                    warnings: [...warnings, warning],
                });

                return true;
            }
        }

        return false;
    }

    /**
     * Log start of task runner
     */
    onTaskStart(repository: string) {
        this.updateTask(repository, {
            step: 'START',
            color: chalk.yellow,
        });
    }

    /**
     * Log start of linting of given repository
     */
    onLintStart(repository: string, fileCount: number) {
        this.updateTask(repository, {
            fileCount,
            currentFileIndex: 0,
            step: 'LINT',
            color: chalk.yellow,
        });
    }

    /**
     * Log end of linting of given repository
     */
    onLintEnd(repository: string, resultCount: number) {
        this.scannedRepositories++;
        this.tasks = this.tasks.filter(task => task.repository !== repository);

        const hasErrors = resultCount > 0;
        const color = hasErrors ? chalk.red : chalk.green;
        const postfix = hasErrors
            ? `with ${resultCount} errors`
            : 'without errors';

        this.messages.push({
            content: `[DONE] ${repository} ${postfix}`,
            color,
        });
    }

    /**
     * Log end of a single file lint
     */
    onFileLintEnd(repository: string, currentFileIndex: number) {
        this.updateTask(repository, {
            currentFileIndex,
            step: 'LINT',
            color: chalk.green,
        });
    }

    /**
     * Log warning about linter crashing
     */
    onLinterCrash(repository: string, erroneousRule: string) {
        const isNewWarning = this.addWarningToTask(repository, erroneousRule);

        if (isNewWarning) {
            this.messages.push({
                content: Templates.LINT_FAILURE_TEMPLATE(
                    repository,
                    erroneousRule
                ),
                color: chalk.yellow,
            });
        }
    }

    /**
     * Log warning about clone failure
     */
    onCloneFailure(repository: string) {
        this.messages.push({
            content: Templates.CLONE_FAILURE_TEMPLATE(repository),
            color: chalk.yellow,
        });
    }

    /**
     * Log warning about filesystem read failure
     */
    onReadFailure(repository: string) {
        this.messages.push({
            content: Templates.READ_FAILURE_TEMPLATE(repository),
            color: chalk.yellow,
        });
    }

    /**
     * Log warning about result writing failure
     */
    onWriteFailure(repository: string) {
        this.messages.push({
            content: Templates.WRITE_FAILURE_TEMPLATE(repository),
            color: chalk.yellow,
        });
    }

    /**
     * Log start of cloning of given repository
     */
    onRepositoryClone(repository: string) {
        this.updateTask(repository, { step: 'CLONE', color: chalk.yellow });
    }

    /**
     * Log start of cloning of given repository
     */
    onRepositoryRead(repository: string) {
        this.updateTask(repository, { step: 'READ', color: chalk.yellow });
    }

    /**
     * Print current tasks and messages
     */
    print() {
        const terminalHeight = process.stdout.rows;
        const terminalWidth = process.stdout.columns;

        const rows = [
            Templates.REPOSITORIES_STATUS_TEMPLATE(this.scannedRepositories),
            ...this.tasks.map(Templates.TASK_TEMPLATE),
            ' ', // Empty line between tasks and messages
            ...this.messages.map(message => message.content),
        ].map(row => {
            // Prevent row wrapping
            if (row.length > terminalWidth) {
                return `${row.slice(0, terminalWidth - 3)}...`;
            }

            return row;
        });

        const colors = [
            null,
            ...this.tasks.map(task => task.color),
            null,
            ...this.messages.map(message => message.color),
        ];

        // Display notification about overflowing rows
        const overflowingRowCount = rows.length - terminalHeight;
        if (overflowingRowCount > 0) {
            rows.splice(terminalHeight - 1);
            colors.splice(terminalHeight - 1);

            rows.push(Templates.OVERFLOWING_ROWS(overflowingRowCount));
            colors.push(chalk.black.bgYellow);
        }

        // Update colors of whole row
        for (const [rowIndex, color] of colors.entries()) {
            if (this.previousColors[rowIndex] !== color) {
                const row = rows[rowIndex];
                const colorMethod = color || DEFAULT_COLOR_METHOD;

                process.stdout.cursorTo(0, rowIndex);
                process.stdout.clearLine(0);
                process.stdout.write(colorMethod(row));
            }
        }

        const formattedLog = rows.join('\n');
        const updates = diffLogs(this.previousLog, formattedLog);

        // Update characters changes, e.g. step or file count changes
        for (const { x, y, characters, wholeRow } of updates) {
            const colorMethod = colors[y] || DEFAULT_COLOR_METHOD;

            // These were already updated by row's color update
            if (this.previousColors[y] !== colors[y]) continue;

            process.stdout.cursorTo(x, y);
            wholeRow && process.stdout.clearLine(0);
            process.stdout.write(colorMethod(characters));
        }

        // Keep cursor on last row at the first or last column
        process.stdout.cursorTo(
            overflowingRowCount >= 0 ? terminalWidth : 0,
            rows.length + 1
        );

        this.previousColors = colors;
        this.previousLog = formattedLog;
    }
}

export default new ProgressLogger();
