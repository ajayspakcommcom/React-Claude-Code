const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";
  const analyze = process.env.ANALYZE === "true";

  return {
    entry: "./src/index.tsx",
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        // CSS Modules — files named *.module.css
        {
          test: /\.module\.css$/,
          use: [
            "style-loader",
            {
              loader: "css-loader",
              options: {
                modules: {
                  localIdentName: "[name]__[local]--[hash:base64:5]",
                },
              },
            },
            "postcss-loader",
          ],
        },
        // Global CSS — all other .css files (including Tailwind)
        {
          test: /\.css$/,
          exclude: /\.module\.css$/,
          use: ["style-loader", "css-loader", "postcss-loader"],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./public/index.html",
      }),
      // Run: ANALYZE=true npm run build
      ...(analyze ? [new BundleAnalyzerPlugin()] : []),
    ],
    optimization: {
      splitChunks: {
        chunks: "all",
        cacheGroups: {
          // Vendor chunk: node_modules that don't change often
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            priority: 10,
            reuseExistingChunk: true,
          },
          // React chunk: react + react-dom split out for long-term caching
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: "react-vendor",
            priority: 20,
            reuseExistingChunk: true,
          },
        },
      },
    },
    output: {
      // Content-hash for long-term caching: browser re-downloads only changed chunks
      filename: isProduction ? "[name].[contenthash:8].js" : "[name].js",
      chunkFilename: isProduction ? "[name].[contenthash:8].chunk.js" : "[name].chunk.js",
      path: path.resolve(__dirname, "dist"),
      clean: true,
    },
    devServer: {
      port: 3000,
      open: true,
    },
  };
};
