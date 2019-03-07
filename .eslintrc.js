module.exports = {
    "env": {
        "browser": true,
        "node": true
    },
    "extends": ["react-app", "airbnb", "plugin:jsx-a11y/recommended"],
    "plugins": ["jsx-a11y"],
    "globals": {
        "$": true
    },
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        }
    },
    "parser": "babel-eslint",
    "rules": {
        "react/jsx-filename-extension": [1, { "extensions": [".js", ".jsx"] }],
        "no-param-reassign": 0,
        "func-names": ["error", "never"],
        "max-len": 0,
        "no-underscore-dangle": 0,
        "no-plusplus": ["error", { "allowForLoopAfterthoughts": true }],
        "brace-style": ["error", "stroustrup", { "allowSingleLine": true }],
        "jsx-a11y/label-has-for": 0,
        "jsx-a11y/label-has-associated-control": 0,
        "no-mixed-spaces-and-tabs": [2, "smart-tabs"],
        "allowIndentationTabs": true,
        "import/no-extraneous-dependencies": ["error", {"devDependencies": false, "optionalDependencies": false, "peerDependencies": false}]
    }
};