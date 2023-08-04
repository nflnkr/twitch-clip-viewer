import { Button, Modal } from "@nextui-org/react";
import { DateRange, RangeKeyDict } from "react-date-range";
import { applyCalendarDates, closeCalendarModal, setCalendarModalEndDate, setCalendarModalStartDate, useAppStore } from "../../stores/app";
import { useMemo } from "react";
import { Range } from "react-date-range";


export default function DateRangeModal() {
    const isCalendarModalShown = useAppStore(state => state.isCalendarModalShown);
    const calendarModalStartDate = useAppStore(state => state.calendarModalStartDate);
    const calendarModalEndDate = useAppStore(state => state.calendarModalEndDate);

    const dateRange: Range = useMemo(() => ({
        startDate: new Date(calendarModalStartDate),
        endDate: new Date(calendarModalEndDate),
        key: "selection",
    }), [calendarModalEndDate, calendarModalStartDate]);

    function handleRangeChange(item: RangeKeyDict) {
        const newStartDate = item.selection.startDate?.getTime();
        const newEndDate = item.selection.endDate?.getTime();
        if (!newStartDate || !newEndDate) return;

        setCalendarModalStartDate(newStartDate);
        setCalendarModalEndDate(newEndDate);
    }

    return (
        <Modal
            noPadding
            blur
            open={isCalendarModalShown}
            onClose={closeCalendarModal}
            css={{
                maxWidth: "332px",
                backgroundColor: "rgb(189, 212, 255)",
            }}
        >
            <Modal.Body>
                <DateRange
                    onChange={handleRangeChange}
                    maxDate={new Date()}
                    ranges={[dateRange]}
                    direction="vertical"
                />
            </Modal.Body>
            <Modal.Footer css={{
                display: "flex",
            }}>
                <Button css={{ minWidth: 0, flexGrow: 1 }} onPress={applyCalendarDates}>Confirm</Button>
                <Button css={{ minWidth: 0, flexGrow: 1 }} onPress={closeCalendarModal}>Cancel</Button>
            </Modal.Footer>
        </Modal>
    );
}