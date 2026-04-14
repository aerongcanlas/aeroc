import * as React from "react";

import { cn } from "@/lib/utils";

function Text({ children, className, ...props }: React.ComponentProps<"p">) {
    return (
        <p
            className={cn(className)}
            {...props}>
            {children}
        </p>
    );
}

export { Text };
