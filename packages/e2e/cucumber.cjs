module.exports = {
  default: {
    requireModule: ["ts-node/register"],
    require: ["./support/**/*.ts", "./step-definitions/**/*.ts"],
    format: ["progress"],
    failFast: false,
    worldParameters: {},
    import: []
  }
};

