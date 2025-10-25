import React from 'react';
import "@material/web/iconbutton/icon-button.js";
import "@material/web/icon/icon.js";

const CategoryItemGeneral = ({ category }) => {
    return (
        <div
            key={category.code}
            className="border rounded-lg p-4 flex justify-between items-center transition-colors border-[var(--theme-outline)] opacity-60"
        >
            <div className="flex items-center gap-4">
                <div>
                    <md-icon-button disabled>
                        <md-icon>check_box_outline_blank</md-icon>
                    </md-icon-button>
                </div>
                <div>
                    <p className="font-semibold text-lg">{category.name}</p>
                </div>
            </div>
            <div className="flex gap-2 items-center">
                <md-icon-button disabled>
                    <md-icon>edit</md-icon>
                </md-icon-button>
                <md-icon-button disabled>
                    <md-icon>delete</md-icon>
                </md-icon-button>
            </div>
        </div>
    );
};

export default CategoryItemGeneral;
