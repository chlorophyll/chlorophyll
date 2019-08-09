<template>
  <v-card>
    <v-container fluid>
      <v-layout column>
        <v-flex
          justify-self-stretch
          py-0
          d-flex
          class="black"
        >
          <preview-model
            :width="size"
            :height="size"
            :pattern="pattern"
            :renderer="renderer"
            :loader="loader"
          />
        </v-flex>
        <v-flex>
          <v-layout>
          <v-card-text class="headline" >
            {{ pattern.name }}
          </v-card-text>
            <v-flex shrink>
              <v-btn icon><v-icon>mdi-close</v-icon></v-btn>
            </v-flex>
          </v-layout>
        </v-flex>
        <v-flex>
          <v-card-text>
            <v-slider
              label="crossfade"
            />
          </v-card-text>
        </v-flex>
        <v-flex shrink>
          <v-card-actions>
            <v-btn color="primary">Add to queue</v-btn>
            <v-btn>Play next</v-btn>
            <v-btn>Play now</v-btn>
          </v-card-actions>
        </v-flex>
      </v-layout>
    </v-container>
  </v-card>
</template>

<script>
import PreviewModel from '@/components/PreviewModel';
export default {
  props: ['pattern', 'size', 'renderer', 'loader'],
  components: { PreviewModel },
  name: 'preview-card',
};
</script>
