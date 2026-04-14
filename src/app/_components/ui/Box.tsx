import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const boxVariants = cva("", {
    variants: {
        variant: {
            default: "",
            panel: "p-6 rounded-2xl bg-gradient-to-br from-surface to-surface-2 border border-white/[0.06]",
        },
    },
    defaultVariants: {
        variant: "default",
    },
});

function Box({
    children,
    className,
    onClick,
    variant,
    ...props
}: React.ComponentProps<"div"> & VariantProps<typeof boxVariants>) {
    return (
        <div
            className={cn(
                boxVariants({ variant }),
                onClick && "cursor-pointer",
                className,
            )}
            onClick={onClick}
            {...props}>
            {children}
        </div>
    );
}

export { Box, boxVariants };
